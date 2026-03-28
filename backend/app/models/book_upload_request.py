import enum
from datetime import datetime
from sqlalchemy import Column, Integer, DateTime, Enum, Text, String, ForeignKey
from sqlalchemy.orm import relationship
from ..core.database import Base


class UploadRequestStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    DECLINED = "DECLINED"


class BookUploadRequest(Base):
    __tablename__ = "book_upload_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(500), nullable=False)
    author = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    user_note = Column(Text, nullable=True)           # why the user wants this book
    admin_note = Column(Text, nullable=True)           # admin's response note
    status = Column(Enum(UploadRequestStatus), default=UploadRequestStatus.PENDING, nullable=False)
    requested_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    user = relationship("User", foreign_keys=[user_id])
    reviewer = relationship("User", foreign_keys=[reviewed_by])
