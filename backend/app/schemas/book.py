from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class BookCreate(BaseModel):
    title: str
    author: str
    category: Optional[str] = None
    description: Optional[str] = None
    isbn: Optional[str] = None
    published_year: Optional[int] = None


class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    isbn: Optional[str] = None
    published_year: Optional[int] = None


class BookResponse(BaseModel):
    id: int
    title: str
    author: str
    category: Optional[str]
    description: Optional[str]
    isbn: Optional[str]
    published_year: Optional[int]
    file_type: Optional[str]
    file_size: Optional[int]
    uploaded_by: Optional[int]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
