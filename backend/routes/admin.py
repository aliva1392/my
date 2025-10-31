from fastapi import APIRouter, HTTPException, Header, Depends
from database import db
from utils.auth import decode_access_token
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

router = APIRouter(prefix="/admin", tags=["admin"])

# Admin check
async def verify_admin(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="احراز هویت لازم است")
    
    token = authorization.replace("Bearer ", "")
    payload = decode_access_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="توکن نامعتبر است")
    
    user_id = payload.get("sub")
    user = await db.users.find_one({"id": user_id})
    
    if not user:
        raise HTTPException(status_code=404, detail="کاربر پیدا نشد")
    
    # Check if user is admin (you can add is_admin field to user model)
    if not user.get('is_admin', False):
        raise HTTPException(status_code=403, detail="دسترسی محدود به ادمین")
    
    return user_id

class OrderStatusUpdate(BaseModel):
    status: str  # pending, processing, completed, cancelled

class PricingUpdate(BaseModel):
    color_class_id: str
    print_type: str
    tier_min: int
    tier_max: float
    price: float

# Dashboard Statistics
@router.get("/dashboard")
async def get_dashboard_stats(admin_id: str = Depends(verify_admin)):
    # Total orders
    total_orders = await db.orders.count_documents({})
    
    # Orders by status
    pending_orders = await db.orders.count_documents({"status": "pending"})
    processing_orders = await db.orders.count_documents({"status": "processing"})
    completed_orders = await db.orders.count_documents({"status": "completed"})
    
    # Total revenue
    orders = await db.orders.find({"status": "completed"}).to_list(10000)
    total_revenue = sum(order.get('total_amount', 0) for order in orders)
    
    # Today's orders
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_orders = await db.orders.count_documents({"created_at": {"$gte": today_start}})
    
    # This month's orders
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_orders = await db.orders.count_documents({"created_at": {"$gte": month_start}})
    
    # Total users
    total_users = await db.users.count_documents({})
    
    return {
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "processing_orders": processing_orders,
        "completed_orders": completed_orders,
        "total_revenue": total_revenue,
        "today_orders": today_orders,
        "month_orders": month_orders,
        "total_users": total_users
    }

# Orders Management
@router.get("/orders")
async def get_all_orders(
    status: Optional[str] = None,
    limit: int = 100,
    skip: int = 0,
    admin_id: str = Depends(verify_admin)
):
    query = {}
    if status:
        query['status'] = status
    
    orders = await db.orders.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.orders.count_documents(query)
    
    # Get user info for each order and remove _id
    for order in orders:
        order.pop('_id', None)  # Remove MongoDB _id
        user = await db.users.find_one({"id": order['user_id']})
        if user:
            order['user_name'] = user.get('name', 'نامشخص')
            order['user_phone'] = user.get('phone', 'نامشخص')
    
    return {
        "orders": orders,
        "total": total,
        "page": skip // limit + 1,
        "pages": (total + limit - 1) // limit
    }

@router.get("/orders/{order_id}")
async def get_order_detail(order_id: str, admin_id: str = Depends(verify_admin)):
    order = await db.orders.find_one({"id": order_id})
    
    if not order:
        raise HTTPException(status_code=404, detail="سفارش پیدا نشد")
    
    order.pop('_id', None)  # Remove MongoDB _id
    
    # Get user info
    user = await db.users.find_one({"id": order['user_id']})
    if user:
        order['user_name'] = user.get('name', 'نامشخص')
        order['user_phone'] = user.get('phone', 'نامشخص')
    
    return order

@router.put("/orders/{order_id}/status")
async def update_order_status(
    order_id: str,
    status_update: OrderStatusUpdate,
    admin_id: str = Depends(verify_admin)
):
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": status_update.status, "updated_at": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="سفارش پیدا نشد")
    
    return {"message": "وضعیت سفارش به‌روز شد", "status": status_update.status}

# Users Management
@router.get("/users")
async def get_all_users(
    limit: int = 100,
    skip: int = 0,
    admin_id: str = Depends(verify_admin)
):
    users = await db.users.find({}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents({})
    
    # Get order count for each user and remove MongoDB _id
    for user in users:
        user.pop('_id', None)  # Remove MongoDB _id
        order_count = await db.orders.count_documents({"user_id": user['id']})
        user['order_count'] = order_count
        # Remove password from response
        user.pop('password', None)
    
    return {
        "users": users,
        "total": total,
        "page": skip // limit + 1,
        "pages": (total + limit - 1) // limit
    }

@router.get("/users/{user_id}/orders")
async def get_user_orders(user_id: str, admin_id: str = Depends(verify_admin)):
    orders = await db.orders.find({"user_id": user_id}).sort("created_at", -1).to_list(1000)
    user = await db.users.find_one({"id": user_id})
    
    if not user:
        raise HTTPException(status_code=404, detail="کاربر پیدا نشد")
    
    # Remove MongoDB _id from orders
    for order in orders:
        order.pop('_id', None)
    
    user.pop('_id', None)
    user.pop('password', None)
    
    return {
        "user": user,
        "orders": orders,
        "total_orders": len(orders),
        "total_spent": sum(order.get('total_amount', 0) for order in orders)
    }

# Pricing Management
@router.get("/pricing")
async def get_pricing_config(admin_id: str = Depends(verify_admin)):
    # Try to get pricing from database first
    pricing_doc = await db.pricing_config.find_one({"id": "pricing_config"})
    
    if not pricing_doc:
        # If no pricing in DB, initialize from hardcoded values
        from utils.pricing import paper_sizes, color_classes, print_types, services, pricing_tiers
        pricing_data = {
            "id": "pricing_config",
            "paper_sizes": paper_sizes,
            "color_classes": color_classes,
            "print_types": print_types,
            "services": services,
            "pricing_tiers": pricing_tiers
        }
        await db.pricing_config.insert_one(pricing_data)
        pricing_doc = pricing_data
    
    # Remove MongoDB _id
    pricing_doc.pop('_id', None)
    return pricing_doc

@router.post("/pricing/initialize")
async def initialize_pricing(admin_id: str = Depends(verify_admin)):
    """Initialize or reset pricing to default values"""
    from utils.pricing import paper_sizes, color_classes, print_types, services, pricing_tiers
    
    pricing_data = {
        "id": "pricing_config",
        "paper_sizes": paper_sizes,
        "color_classes": color_classes,
        "print_types": print_types,
        "services": services,
        "pricing_tiers": pricing_tiers
    }
    
    # Upsert (update if exists, insert if not)
    await db.pricing_config.replace_one(
        {"id": "pricing_config"},
        pricing_data,
        upsert=True
    )
    
    return {"message": "قیمت‌ها با موفقیت مقداردهی شدند", "data": pricing_data}

class ServiceUpdateModel(BaseModel):
    price: float
    min_pages: Optional[int] = None

@router.put("/pricing/service/{service_id}")
async def update_service_price(
    service_id: str,
    service_update: ServiceUpdateModel,
    admin_id: str = Depends(verify_admin)
):
    """Update service pricing"""
    pricing_doc = await db.pricing_config.find_one({"id": "pricing_config"})
    
    if not pricing_doc:
        raise HTTPException(status_code=404, detail="تنظیمات قیمت پیدا نشد")
    
    # Find and update the service
    services = pricing_doc.get('services', [])
    service_found = False
    
    for service in services:
        if service['id'] == service_id:
            service['price'] = service_update.price
            if service_update.min_pages is not None:
                service['min_pages'] = service_update.min_pages
            elif 'min_pages' in service and service_update.min_pages is None:
                # Keep existing min_pages if not provided
                pass
            service_found = True
            break
    
    if not service_found:
        raise HTTPException(status_code=404, detail="خدمت پیدا نشد")
    
    # Update in database
    await db.pricing_config.update_one(
        {"id": "pricing_config"},
        {"$set": {"services": services}}
    )
    
    return {"message": "قیمت خدمت با موفقیت به‌روز شد", "service_id": service_id}

class TierUpdateModel(BaseModel):
    min: int
    max: float
    single: float
    double: float

@router.put("/pricing/tier/{color_class_id}/{tier_index}")
async def update_pricing_tier(
    color_class_id: str,
    tier_index: int,
    tier_update: TierUpdateModel,
    admin_id: str = Depends(verify_admin)
):
    """Update pricing tier for a specific color class"""
    pricing_doc = await db.pricing_config.find_one({"id": "pricing_config"})
    
    if not pricing_doc:
        raise HTTPException(status_code=404, detail="تنظیمات قیمت پیدا نشد")
    
    pricing_tiers = pricing_doc.get('pricing_tiers', {})
    
    if color_class_id not in pricing_tiers:
        raise HTTPException(status_code=404, detail="کلاس رنگی پیدا نشد")
    
    tiers = pricing_tiers[color_class_id]
    
    if tier_index < 0 or tier_index >= len(tiers):
        raise HTTPException(status_code=404, detail="رده قیمتی پیدا نشد")
    
    # Update the tier
    tiers[tier_index] = {
        'min': tier_update.min,
        'max': tier_update.max,
        'single': tier_update.single,
        'double': tier_update.double
    }
    
    pricing_tiers[color_class_id] = tiers
    
    # Update in database
    await db.pricing_config.update_one(
        {"id": "pricing_config"},
        {"$set": {"pricing_tiers": pricing_tiers}}
    )
    
    return {
        "message": "تعرفه با موفقیت به‌روز شد",
        "color_class_id": color_class_id,
        "tier_index": tier_index
    }