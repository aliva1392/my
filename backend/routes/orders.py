from fastapi import APIRouter, HTTPException, Header
from models.order import OrderCreate, OrderResponse, Order, OrderItem
from utils.auth import decode_access_token
from typing import List, Optional
from database import db

router = APIRouter(prefix="/orders", tags=["orders"])

async def get_user_from_token(authorization: str):
    if not authorization or not authorization.startswith("Bearer "):
        return None
    
    token = authorization.replace("Bearer ", "")
    payload = decode_access_token(token)
    
    if not payload:
        return None
    
    return payload.get("sub")

@router.post("/", response_model=OrderResponse)
async def create_order(order_data: OrderCreate, authorization: str = Header(None)):
    user_id = await get_user_from_token(authorization)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="احراز هویت لازم است")
    
    # Calculate total
    total_amount = sum(item.total_price for item in order_data.items)
    
    # Create order
    order = Order(
        user_id=user_id,
        items=[OrderItem(**item.dict()) for item in order_data.items],
        total_amount=total_amount
    )
    
    # Insert into database
    await db.orders.insert_one(order.dict())
    
    # Clear cart
    await db.carts.update_one(
        {"user_id": user_id},
        {"$set": {"items": []}}
    )
    
    return OrderResponse(**order.dict())

@router.post("/checkout", response_model=OrderResponse)
async def checkout_cart(authorization: str = Header(None)):
    user_id = await get_user_from_token(authorization)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="احراز هویت لازم است")
    
    # Get cart
    cart = await db.carts.find_one({"user_id": user_id})
    
    if not cart or not cart.get('items'):
        raise HTTPException(status_code=400, detail="سبد خرید خالی است")
    
    # Calculate total
    total_amount = sum(item['total_price'] for item in cart['items'])
    
    # Create order from cart
    order = Order(
        user_id=user_id,
        items=[OrderItem(**item) for item in cart['items']],
        total_amount=total_amount
    )
    
    # Insert order
    await db.orders.insert_one(order.dict())
    
    # Clear cart
    await db.carts.update_one(
        {"user_id": user_id},
        {"$set": {"items": []}}
    )
    
    return OrderResponse(**order.dict())

@router.get("/", response_model=List[OrderResponse])
async def get_orders(status: Optional[str] = None, authorization: str = Header(None)):
    user_id = await get_user_from_token(authorization)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="احراز هویت لازم است")
    
    # Build query
    query = {"user_id": user_id}
    if status and status != 'all':
        query['status'] = status
    
    # Get orders
    orders = await db.orders.find(query).sort("created_at", -1).to_list(1000)
    
    return [OrderResponse(**order) for order in orders]

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str, authorization: str = Header(None)):
    user_id = await get_user_from_token(authorization)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="احراز هویت لازم است")
    
    order = await db.orders.find_one({"id": order_id, "user_id": user_id})
    
    if not order:
        raise HTTPException(status_code=404, detail="سفارش پیدا نشد")
    
    return OrderResponse(**order)

@router.delete("/{order_id}")
async def delete_order(order_id: str, authorization: str = Header(None)):
    user_id = await get_user_from_token(authorization)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="احراز هویت لازم است")
    
    result = await db.orders.delete_one({"id": order_id, "user_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="سفارش پیدا نشد")
    
    return {"message": "سفارش حذف شد"}