from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from ..models.user import UserRole


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
