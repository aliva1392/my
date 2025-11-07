from fastapi import APIRouter, HTTPException, Header, Depends
from database import db
from utils.auth import decode_access_token
from models.address import AddressCreate, AddressUpdate, AddressResponse
from typing import List
from datetime import datetime

router = APIRouter(prefix="/addresses", tags=["addresses"])

# Authentication dependency
async def get_current_user(authorization: str = Header(None)):
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
    
    return user_id

@router.get("/", response_model=List[AddressResponse])
async def get_user_addresses(current_user: str = Depends(get_current_user)):
    """دریافت تمام آدرس‌های کاربر"""
    addresses = await db.addresses.find({"user_id": current_user}).to_list(100)
    
    for address in addresses:
        address.pop('_id', None)
    
    return addresses

@router.post("/", response_model=AddressResponse, status_code=201)
async def create_address(
    address: AddressCreate,
    current_user: str = Depends(get_current_user)
):
    """ایجاد آدرس جدید"""
    import uuid
    
    # اگر این آدرس به عنوان پیش‌فرض تعیین شده، باقی را غیرفعال کن
    if address.is_default:
        await db.addresses.update_many(
            {"user_id": current_user},
            {"$set": {"is_default": False}}
        )
    
    address_dict = address.dict()
    address_dict['id'] = str(uuid.uuid4())
    address_dict['user_id'] = current_user
    address_dict['created_at'] = datetime.utcnow()
    address_dict['updated_at'] = datetime.utcnow()
    
    await db.addresses.insert_one(address_dict)
    address_dict.pop('_id', None)
    
    return address_dict

@router.get("/{address_id}", response_model=AddressResponse)
async def get_address(
    address_id: str,
    current_user: str = Depends(get_current_user)
):
    """دریافت یک آدرس خاص"""
    address = await db.addresses.find_one({"id": address_id, "user_id": current_user})
    
    if not address:
        raise HTTPException(status_code=404, detail="آدرس پیدا نشد")
    
    address.pop('_id', None)
    return address

@router.put("/{address_id}", response_model=AddressResponse)
async def update_address(
    address_id: str,
    address_update: AddressUpdate,
    current_user: str = Depends(get_current_user)
):
    """به‌روزرسانی آدرس"""
    # بررسی وجود آدرس
    existing_address = await db.addresses.find_one({"id": address_id, "user_id": current_user})
    if not existing_address:
        raise HTTPException(status_code=404, detail="آدرس پیدا نشد")
    
    # اگر این آدرس به عنوان پیش‌فرض تعیین می‌شود، باقی را غیرفعال کن
    if address_update.is_default:
        await db.addresses.update_many(
            {"user_id": current_user, "id": {"$ne": address_id}},
            {"$set": {"is_default": False}}
        )
    
    # فقط فیلدهای ارسال شده را به‌روز کن
    update_data = {k: v for k, v in address_update.dict(exclude_unset=True).items()}
    update_data['updated_at'] = datetime.utcnow()
    
    await db.addresses.update_one(
        {"id": address_id, "user_id": current_user},
        {"$set": update_data}
    )
    
    updated_address = await db.addresses.find_one({"id": address_id})
    updated_address.pop('_id', None)
    
    return updated_address

@router.delete("/{address_id}", status_code=204)
async def delete_address(
    address_id: str,
    current_user: str = Depends(get_current_user)
):
    """حذف آدرس"""
    result = await db.addresses.delete_one({"id": address_id, "user_id": current_user})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="آدرس پیدا نشد")
    
    return None

@router.post("/{address_id}/set-default", response_model=AddressResponse)
async def set_default_address(
    address_id: str,
    current_user: str = Depends(get_current_user)
):
    """تعیین آدرس به عنوان پیش‌فرض"""
    # بررسی وجود آدرس
    address = await db.addresses.find_one({"id": address_id, "user_id": current_user})
    if not address:
        raise HTTPException(status_code=404, detail="آدرس پیدا نشد")
    
    # غیرفعال کردن سایر آدرس‌های پیش‌فرض
    await db.addresses.update_many(
        {"user_id": current_user},
        {"$set": {"is_default": False}}
    )
    
    # فعال کردن این آدرس
    await db.addresses.update_one(
        {"id": address_id},
        {"$set": {"is_default": True, "updated_at": datetime.utcnow()}}
    )
    
    updated_address = await db.addresses.find_one({"id": address_id})
    updated_address.pop('_id', None)
    
    return updated_address
