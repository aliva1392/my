from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

class PriceTier(BaseModel):
    min: int
    max: int
    single: float
    double: float

class PricingConfig(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    color_class_id: str
    tiers: List[PriceTier]
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    updated_by: Optional[str] = None

class ServiceConfig(BaseModel):
    id: str
    label: str
    price: float
    min_pages: Optional[int] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    updated_by: Optional[str] = None

class PriceUpdate(BaseModel):
    color_class_id: str
    tiers: List[dict]

class ServiceUpdate(BaseModel):
    id: str
    label: str
    price: float
    min_pages: Optional[int] = None