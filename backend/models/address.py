from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid

class Address(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str  # خانه، محل کار، و غیره
    province: str  # استان
    city: str  # شهر
    full_address: str  # آدرس کامل
    postal_code: str  # کدپستی
    phone: str  # تلفن
    latitude: Optional[float] = None  # مختصات GPS
    longitude: Optional[float] = None
    is_default: bool = False  # آدرس پیش‌فرض
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class AddressCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    province: str = Field(..., min_length=1, max_length=100)
    city: str = Field(..., min_length=1, max_length=100)
    full_address: str = Field(..., min_length=5, max_length=500)
    postal_code: str = Field(..., pattern=r'^\d{10}$')  # کدپستی 10 رقمی
    phone: str = Field(..., pattern=r'^09\d{9}$')  # شماره موبایل ایران
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    is_default: bool = False

class AddressUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    province: Optional[str] = Field(None, min_length=1, max_length=100)
    city: Optional[str] = Field(None, min_length=1, max_length=100)
    full_address: Optional[str] = Field(None, min_length=5, max_length=500)
    postal_code: Optional[str] = Field(None, pattern=r'^\d{10}$')
    phone: Optional[str] = Field(None, pattern=r'^09\d{9}$')
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    is_default: Optional[bool] = None

class AddressResponse(BaseModel):
    id: str
    user_id: str
    title: str
    province: str
    city: str
    full_address: str
    postal_code: str
    phone: str
    latitude: Optional[float]
    longitude: Optional[float]
    is_default: bool
    created_at: datetime
    updated_at: datetime
