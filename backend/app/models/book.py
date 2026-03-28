from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, BigInteger, ForeignKey
from sqlalchemy.orm import relationship
from ..core.database import Base


class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False, index=True)
    author = Column(String(255), nullable=False)
    category = Column(String(100))
    description = Column(Text)
    isbn = Column(String(20), unique=True, nullable=True)
    published_year = Column(Integer, nullable=True)
    # MinIO object key - None if file not yet uploaded
    file_key = Column(String(500), nullable=True)
    file_type = Column(String(50), nullable=True)
    file_size = Column(BigInteger, nullable=True)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    uploader = relationship("User", foreign_keys=[uploaded_by])
