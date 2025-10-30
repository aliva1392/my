from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class CartItem(BaseModel):
    id: str
    paper_size: str
    color_class: str
    print_type: str
    pages: int
    copies: int
    service: str
    price_per_copy: float
    service_cost: float
    total_price: float
    notes: Optional[str] = None
    file_method: Optional[str] = None
    file_details: Optional[str] = None

class Cart(BaseModel):
    user_id: str
    items: List[CartItem] = []
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CartItemCreate(BaseModel):
    paper_size: str
    color_class: str
    print_type: str
    pages: int
    copies: int
    service: str = 'none'
    price_per_copy: float
    service_cost: float
    total_price: float
    notes: Optional[str] = None
    file_method: Optional[str] = 'upload'
    file_details: Optional[str] = None

class CartResponse(BaseModel):
    items: List[CartItem]
    total: float