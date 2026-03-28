from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from ..models.book_upload_request import UploadRequestStatus
from .user import UserResponse


class BookUploadRequestCreate(BaseModel):
    title: str
    author: Optional[str] = None
    description: Optional[str] = None
    user_note: Optional[str] = None


class BookUploadRequestResponse(BaseModel):
    id: int
    user_id: int
    title: str
    author: Optional[str]
    description: Optional[str]
    user_note: Optional[str]
    admin_note: Optional[str]
    status: UploadRequestStatus
    requested_at: datetime
    reviewed_by: Optional[int]
    reviewed_at: Optional[datetime]
    user: Optional[UserResponse] = None

    model_config = {"from_attributes": True}


class UploadReviewAction(BaseModel):
    admin_note: Optional[str] = None
