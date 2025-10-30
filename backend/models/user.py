from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    phone: str
    password: str
    name: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    phone: str
    password: str
    name: Optional[str] = None

class UserLogin(BaseModel):
    phone: str
    password: str

class UserResponse(BaseModel):
    id: str
    phone: str
    name: Optional[str] = None
    created_at: datetime

class AuthResponse(BaseModel):
    user: UserResponse
    token: str