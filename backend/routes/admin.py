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
    
    # Get order count for each user
    for user in users:
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
    from utils.pricing import paper_sizes, color_classes, print_types, services, pricing_tiers
    return {
        "paper_sizes": paper_sizes,
        "color_classes": color_classes,
        "print_types": print_types,
        "services": services,
        "pricing_tiers": pricing_tiers
    }

# Note: For pricing updates, you would need to implement a database-backed pricing system
# Currently prices are in code. For production, move to database.