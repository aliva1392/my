from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid

class OrderItem(BaseModel):
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

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[OrderItem]
    total_amount: float
    status: str = 'pending'  # pending, processing, completed, cancelled
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class OrderCreate(BaseModel):
    items: List[OrderItem]

class OrderResponse(BaseModel):
    id: str
    user_id: str
    items: List[OrderItem]
    total_amount: float
    status: str
    created_at: datetime
    updated_at: datetime