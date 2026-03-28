from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from .book import BookResponse


class DownloadHistoryResponse(BaseModel):
    id: int
    user_id: int
    book_id: int
    request_id: int
    downloaded_at: datetime
    book: Optional[BookResponse] = None

    model_config = {"from_attributes": True}
