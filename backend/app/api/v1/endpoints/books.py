from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime
from ....core.database import get_db
from ....core.deps import get_current_user
from ....models.book import Book
from ....models.download_request import DownloadRequest, RequestStatus
from ....models.download_history import DownloadHistory
from ....models.user import User
from ....schemas.book import BookResponse
from ....schemas.download_request import DownloadRequestResponse, DownloadRequestCreate
from ....services.storage import storage_service

router = APIRouter()


@router.get("", response_model=List[BookResponse])
def list_books(
    search: Optional[str] = Query(None, description="Search by title or author"),
    category: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(Book)
    if search:
        like = f"%{search}%"
        query = query.filter(Book.title.ilike(like) | Book.author.ilike(like))
    if category:
        query = query.filter(Book.category == category)
    return query.offset(skip).limit(limit).all()


@router.get("/{book_id}", response_model=BookResponse)
def get_book(
    book_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book


@router.post("/{book_id}/request-download", response_model=DownloadRequestResponse, status_code=201)
def request_download(
    book_id: int,
    payload: DownloadRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    # Prevent duplicate pending requests
    existing = db.query(DownloadRequest).filter(
        DownloadRequest.user_id == current_user.id,
        DownloadRequest.book_id == book_id,
        DownloadRequest.status == RequestStatus.PENDING,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="You already have a pending request for this book")

    req = DownloadRequest(
        user_id=current_user.id,
        book_id=book_id,
        user_note=payload.user_note,
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


@router.get("/{book_id}/download")
def download_book(
    book_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    if not book.file_key:
        raise HTTPException(status_code=404, detail="No file available for this book")

    # Must have an approved request
    approved = db.query(DownloadRequest).filter(
        DownloadRequest.user_id == current_user.id,
        DownloadRequest.book_id == book_id,
        DownloadRequest.status == RequestStatus.APPROVED,
    ).first()

    if not approved:
        raise HTTPException(status_code=403, detail="Download not approved")

    # Record download history
    history = DownloadHistory(
        user_id=current_user.id,
        book_id=book_id,
        request_id=approved.id,
        downloaded_at=datetime.utcnow(),
    )
    db.add(history)
    db.commit()

    # Generate presigned URL (valid 1 hour)
    url = storage_service.get_presigned_url(book.file_key, expires_hours=1)
    return {"download_url": url, "book_title": book.title}
