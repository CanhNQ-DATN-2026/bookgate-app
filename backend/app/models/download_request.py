import enum
from datetime import datetime
from sqlalchemy import Column, Integer, DateTime, Enum, Text, ForeignKey
from sqlalchemy.orm import relationship
from ..core.database import Base


class RequestStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    DECLINED = "DECLINED"


class DownloadRequest(Base):
    __tablename__ = "download_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    status = Column(Enum(RequestStatus), default=RequestStatus.PENDING, nullable=False)
    requested_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    user_note = Column(Text, nullable=True)            # note from user when requesting
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    review_note = Column(Text, nullable=True)          # note from admin when reviewing

    user = relationship("User", foreign_keys=[user_id])
    book = relationship("Book")
    reviewer = relationship("User", foreign_keys=[reviewed_by])
