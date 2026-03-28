from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, model_validator


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
    # file_key is read from the ORM object but never serialised to JSON
    file_key: Optional[str] = Field(None, exclude=True)
    has_file: bool = False
    uploaded_by: Optional[int]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @model_validator(mode="after")
    def compute_has_file(self) -> "BookResponse":
        self.has_file = bool(self.file_key)
        return self
