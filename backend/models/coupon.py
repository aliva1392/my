from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
import uuid

class Coupon(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str  # کد تخفیف (مثلاً: SUMMER2024)
    discount_type: Literal['percentage', 'fixed']  # نوع تخفیف: درصدی یا مبلغ ثابت
    discount_value: float  # مقدار تخفیف (درصد یا مبلغ)
    max_discount_amount: Optional[float] = None  # حداکثر تخفیف (برای درصدی)
    min_order_amount: Optional[float] = None  # حداقل مبلغ سفارش
    usage_limit: Optional[int] = None  # تعداد دفعات استفاده کل
    usage_per_user: Optional[int] = 1  # تعداد دفعات استفاده هر کاربر
    used_count: int = 0  # تعداد دفعات استفاده شده
    is_active: bool = True
    start_date: Optional[datetime] = None  # تاریخ شروع
    end_date: Optional[datetime] = None  # تاریخ انقضا
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CouponCreate(BaseModel):
    code: str = Field(..., min_length=3, max_length=50)
    discount_type: Literal['percentage', 'fixed']
    discount_value: float = Field(..., gt=0)
    max_discount_amount: Optional[float] = Field(None, gt=0)
    min_order_amount: Optional[float] = Field(None, gt=0)
    usage_limit: Optional[int] = Field(None, gt=0)
    usage_per_user: int = Field(1, gt=0)
    is_active: bool = True
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class CouponUpdate(BaseModel):
    code: Optional[str] = Field(None, min_length=3, max_length=50)
    discount_type: Optional[Literal['percentage', 'fixed']] = None
    discount_value: Optional[float] = Field(None, gt=0)
    max_discount_amount: Optional[float] = Field(None, gt=0)
    min_order_amount: Optional[float] = Field(None, gt=0)
    usage_limit: Optional[int] = Field(None, gt=0)
    usage_per_user: Optional[int] = Field(None, gt=0)
    is_active: Optional[bool] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class CouponResponse(BaseModel):
    id: str
    code: str
    discount_type: str
    discount_value: float
    max_discount_amount: Optional[float]
    min_order_amount: Optional[float]
    usage_limit: Optional[int]
    usage_per_user: int
    used_count: int
    is_active: bool
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    created_at: datetime

class CouponValidateRequest(BaseModel):
    code: str
    order_amount: float = Field(..., gt=0)

class CouponValidateResponse(BaseModel):
    is_valid: bool
    message: str
    discount_amount: Optional[float] = None
    final_amount: Optional[float] = None
    coupon: Optional[CouponResponse] = None

class CouponUsage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    coupon_id: str
    user_id: str
    order_id: str
    discount_amount: float
    created_at: datetime = Field(default_factory=datetime.utcnow)
