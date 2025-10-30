from fastapi import APIRouter, HTTPException, Header
from models.cart import CartItemCreate, CartResponse, CartItem, Cart
from utils.auth import decode_access_token
from datetime import datetime
import uuid
from database import db

router = APIRouter(prefix="/cart", tags=["cart"])

async def get_user_from_token(authorization: str):
    if not authorization or not authorization.startswith("Bearer "):
        return None
    
    token = authorization.replace("Bearer ", "")
    payload = decode_access_token(token)
    
    if not payload:
        return None
    
    return payload.get("sub")

@router.post("/", response_model=CartResponse)
async def add_to_cart(item: CartItemCreate, authorization: str = Header(None)):
    user_id = await get_user_from_token(authorization)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="احراز هویت لازم است")
    
    # Get or create cart
    cart = await db.carts.find_one({"user_id": user_id})
    
    cart_item = CartItem(
        id=str(uuid.uuid4()),
        **item.dict()
    )
    
    if cart:
        # Add item to existing cart
        await db.carts.update_one(
            {"user_id": user_id},
            {
                "$push": {"items": cart_item.dict()},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        updated_cart = await db.carts.find_one({"user_id": user_id})
    else:
        # Create new cart
        new_cart = Cart(
            user_id=user_id,
            items=[cart_item]
        )
        await db.carts.insert_one(new_cart.dict())
        updated_cart = new_cart.dict()
    
    items = [CartItem(**item) for item in updated_cart['items']]
    total = sum(item.total_price for item in items)
    
    return CartResponse(items=items, total=total)

@router.get("/", response_model=CartResponse)
async def get_cart(authorization: str = Header(None)):
    user_id = await get_user_from_token(authorization)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="احراز هویت لازم است")
    
    cart = await db.carts.find_one({"user_id": user_id})
    
    if not cart:
        return CartResponse(items=[], total=0)
    
    items = [CartItem(**item) for item in cart['items']]
    total = sum(item.total_price for item in items)
    
    return CartResponse(items=items, total=total)

@router.delete("/{item_id}", response_model=CartResponse)
async def remove_from_cart(item_id: str, authorization: str = Header(None)):
    user_id = await get_user_from_token(authorization)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="احراز هویت لازم است")
    
    # Remove item from cart
    await db.carts.update_one(
        {"user_id": user_id},
        {
            "$pull": {"items": {"id": item_id}},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    
    cart = await db.carts.find_one({"user_id": user_id})
    
    if not cart:
        return CartResponse(items=[], total=0)
    
    items = [CartItem(**item) for item in cart['items']]
    total = sum(item.total_price for item in items)
    
    return CartResponse(items=items, total=total)

@router.delete("/")
async def clear_cart(authorization: str = Header(None)):
    user_id = await get_user_from_token(authorization)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="احراز هویت لازم است")
    
    await db.carts.update_one(
        {"user_id": user_id},
        {"$set": {"items": [], "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "سبد خرید خالی شد"}