from datetime import datetime
from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from ..core.database import Base


class DownloadHistory(Base):
    __tablename__ = "download_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    request_id = Column(Integer, ForeignKey("download_requests.id"), nullable=False)
    downloaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User")
    book = relationship("Book")
    request = relationship("DownloadRequest")
