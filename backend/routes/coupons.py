from fastapi import APIRouter, HTTPException, Header, Depends
from database import db
from utils.auth import decode_access_token
from models.coupon import (
    CouponCreate, CouponUpdate, CouponResponse,
    CouponValidateRequest, CouponValidateResponse, CouponUsage
)
from typing import List, Optional
from datetime import datetime
import uuid

router = APIRouter(prefix="/coupons", tags=["coupons"])

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
    
    if not user or not user.get('is_admin', False):
        raise HTTPException(status_code=403, detail="دسترسی محدود به ادمین")
    
    return user_id

# User authentication
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

# Admin endpoints
@router.post("/admin", response_model=CouponResponse, status_code=201)
async def create_coupon(
    coupon: CouponCreate,
    admin_id: str = Depends(verify_admin)
):
    """ایجاد کد تخفیف جدید (فقط ادمین)"""
    # بررسی تکراری نبودن کد
    existing = await db.coupons.find_one({"code": coupon.code.upper()})
    if existing:
        raise HTTPException(status_code=409, detail="این کد تخفیف قبلاً استفاده شده است")
    
    coupon_dict = coupon.dict()
    coupon_dict['id'] = str(uuid.uuid4())
    coupon_dict['code'] = coupon_dict['code'].upper()  # همیشه حروف بزرگ
    coupon_dict['used_count'] = 0
    coupon_dict['created_at'] = datetime.utcnow()
    coupon_dict['updated_at'] = datetime.utcnow()
    
    await db.coupons.insert_one(coupon_dict)
    coupon_dict.pop('_id', None)
    
    return coupon_dict

@router.get("/admin", response_model=List[CouponResponse])
async def get_all_coupons(
    is_active: Optional[bool] = None,
    admin_id: str = Depends(verify_admin)
):
    """دریافت تمام کدهای تخفیف (فقط ادمین)"""
    query = {}
    if is_active is not None:
        query['is_active'] = is_active
    
    coupons = await db.coupons.find(query).to_list(1000)
    
    for coupon in coupons:
        coupon.pop('_id', None)
    
    return coupons

@router.get("/admin/{coupon_id}", response_model=CouponResponse)
async def get_coupon(
    coupon_id: str,
    admin_id: str = Depends(verify_admin)
):
    """دریافت جزئیات یک کد تخفیف (فقط ادمین)"""
    coupon = await db.coupons.find_one({"id": coupon_id})
    
    if not coupon:
        raise HTTPException(status_code=404, detail="کد تخفیف پیدا نشد")
    
    coupon.pop('_id', None)
    return coupon

@router.put("/admin/{coupon_id}", response_model=CouponResponse)
async def update_coupon(
    coupon_id: str,
    coupon_update: CouponUpdate,
    admin_id: str = Depends(verify_admin)
):
    """به‌روزرسانی کد تخفیف (فقط ادمین)"""
    existing_coupon = await db.coupons.find_one({"id": coupon_id})
    if not existing_coupon:
        raise HTTPException(status_code=404, detail="کد تخفیف پیدا نشد")
    
    update_data = {k: v for k, v in coupon_update.dict(exclude_unset=True).items()}
    
    # اگر کد تغییر می‌کند، بررسی تکراری نبودن
    if 'code' in update_data:
        update_data['code'] = update_data['code'].upper()
        duplicate = await db.coupons.find_one({
            "code": update_data['code'],
            "id": {"$ne": coupon_id}
        })
        if duplicate:
            raise HTTPException(status_code=409, detail="این کد تخفیف قبلاً استفاده شده است")
    
    update_data['updated_at'] = datetime.utcnow()
    
    await db.coupons.update_one(
        {"id": coupon_id},
        {"$set": update_data}
    )
    
    updated_coupon = await db.coupons.find_one({"id": coupon_id})
    updated_coupon.pop('_id', None)
    
    return updated_coupon

@router.delete("/admin/{coupon_id}", status_code=204)
async def delete_coupon(
    coupon_id: str,
    admin_id: str = Depends(verify_admin)
):
    """حذف کد تخفیف (فقط ادمین)"""
    result = await db.coupons.delete_one({"id": coupon_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="کد تخفیف پیدا نشد")
    
    return None

# User endpoints
@router.post("/validate", response_model=CouponValidateResponse)
async def validate_coupon(
    request: CouponValidateRequest,
    current_user: str = Depends(get_current_user)
):
    """اعتبارسنجی کد تخفیف"""
    coupon = await db.coupons.find_one({"code": request.code.upper()})
    
    if not coupon:
        return CouponValidateResponse(
            is_valid=False,
            message="کد تخفیف نامعتبر است"
        )
    
    # بررسی فعال بودن
    if not coupon.get('is_active', False):
        return CouponValidateResponse(
            is_valid=False,
            message="این کد تخفیف غیرفعال است"
        )
    
    # بررسی تاریخ شروع و انقضا
    now = datetime.utcnow()
    if coupon.get('start_date') and now < coupon['start_date']:
        return CouponValidateResponse(
            is_valid=False,
            message="این کد تخفیف هنوز فعال نشده است"
        )
    
    if coupon.get('end_date') and now > coupon['end_date']:
        return CouponValidateResponse(
            is_valid=False,
            message="این کد تخفیف منقضی شده است"
        )
    
    # بررسی حداقل مبلغ سفارش
    if coupon.get('min_order_amount') and request.order_amount < coupon['min_order_amount']:
        return CouponValidateResponse(
            is_valid=False,
            message=f"حداقل مبلغ سفارش برای این کد {coupon['min_order_amount']:,} تومان است"
        )
    
    # بررسی محدودیت استفاده کل
    if coupon.get('usage_limit') and coupon.get('used_count', 0) >= coupon['usage_limit']:
        return CouponValidateResponse(
            is_valid=False,
            message="این کد تخفیف به حد مجاز استفاده رسیده است"
        )
    
    # بررسی محدودیت استفاده هر کاربر
    user_usage_count = await db.coupon_usages.count_documents({
        "coupon_id": coupon['id'],
        "user_id": current_user
    })
    
    if user_usage_count >= coupon.get('usage_per_user', 1):
        return CouponValidateResponse(
            is_valid=False,
            message="شما قبلاً از این کد تخفیف استفاده کرده‌اید"
        )
    
    # محاسبه مبلغ تخفیف
    discount_amount = 0
    
    if coupon['discount_type'] == 'percentage':
        discount_amount = request.order_amount * (coupon['discount_value'] / 100)
        
        # بررسی حداکثر تخفیف
        if coupon.get('max_discount_amount'):
            discount_amount = min(discount_amount, coupon['max_discount_amount'])
    
    elif coupon['discount_type'] == 'fixed':
        discount_amount = min(coupon['discount_value'], request.order_amount)
    
    final_amount = max(0, request.order_amount - discount_amount)
    
    coupon.pop('_id', None)
    
    return CouponValidateResponse(
        is_valid=True,
        message="کد تخفیف معتبر است",
        discount_amount=discount_amount,
        final_amount=final_amount,
        coupon=coupon
    )

@router.post("/apply/{coupon_id}/{order_id}", status_code=201)
async def apply_coupon(
    coupon_id: str,
    order_id: str,
    discount_amount: float,
    current_user: str = Depends(get_current_user)
):
    """ثبت استفاده از کد تخفیف"""
    # بررسی وجود کوپن
    coupon = await db.coupons.find_one({"id": coupon_id})
    if not coupon:
        raise HTTPException(status_code=404, detail="کد تخفیف پیدا نشد")
    
    # ثبت استفاده
    usage = {
        'id': str(uuid.uuid4()),
        'coupon_id': coupon_id,
        'user_id': current_user,
        'order_id': order_id,
        'discount_amount': discount_amount,
        'created_at': datetime.utcnow()
    }
    
    await db.coupon_usages.insert_one(usage)
    
    # افزایش شمارنده استفاده کوپن
    await db.coupons.update_one(
        {"id": coupon_id},
        {"$inc": {"used_count": 1}}
    )
    
    return {"message": "کد تخفیف با موفقیت اعمال شد"}
