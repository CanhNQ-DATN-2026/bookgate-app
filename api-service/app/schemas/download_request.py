from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from ..models.download_request import RequestStatus
from .book import BookResponse
from .user import UserResponse


class DownloadRequestCreate(BaseModel):
    user_note: Optional[str] = None


class DownloadRequestResponse(BaseModel):
    id: int
    user_id: int
    book_id: int
    status: RequestStatus
    user_note: Optional[str]
    requested_at: datetime
    reviewed_by: Optional[int]
    reviewed_at: Optional[datetime]
    review_note: Optional[str]
    book: Optional[BookResponse] = None
    user: Optional[UserResponse] = None

    model_config = {"from_attributes": True}


class ReviewAction(BaseModel):
    review_note: Optional[str] = None
