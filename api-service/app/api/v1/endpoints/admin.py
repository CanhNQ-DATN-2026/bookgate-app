from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from ....core.database import get_db
from ....core.deps import require_admin
from ....models.user import User
from ....models.book import Book
from ....models.download_request import DownloadRequest, RequestStatus
from ....models.download_history import DownloadHistory
from ....models.book_upload_request import BookUploadRequest, UploadRequestStatus
from ....schemas.user import UserResponse
from ....schemas.book import BookResponse, BookUpdate
from ....schemas.download_request import DownloadRequestResponse, ReviewAction
from ....schemas.download_history import DownloadHistoryResponse
from ....schemas.book_upload_request import BookUploadRequestResponse, UploadReviewAction
from ....services.storage import storage_service

router = APIRouter()

ALLOWED_FILE_TYPES = {"application/pdf", "application/epub+zip", "application/zip"}
MAX_FILE_SIZE_MB = 200


# ─── Users ───────────────────────────────────────────────────────────────────

@router.get("/users", response_model=List[UserResponse])
def list_users(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return db.query(User).offset(skip).limit(limit).all()


@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# ─── Books ────────────────────────────────────────────────────────────────────

@router.post("/books", response_model=BookResponse, status_code=201)
async def create_book(
    title: str = Form(...),
    author: str = Form(...),
    category: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    isbn: Optional[str] = Form(None),
    published_year: Optional[int] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    file_key = None
    file_type = None
    file_size = None

    if file and file.filename:
        content = await file.read()
        size_mb = len(content) / (1024 * 1024)
        if size_mb > MAX_FILE_SIZE_MB:
            raise HTTPException(status_code=413, detail=f"File exceeds {MAX_FILE_SIZE_MB} MB limit")

        ct = file.content_type or ""
        if ct not in ALLOWED_FILE_TYPES:
            raise HTTPException(
                status_code=415,
                detail=f"Unsupported file type '{ct}'. Allowed: pdf, epub, zip",
            )

        file_key = storage_service.upload_file(content, file.filename, ct)
        file_type = ct
        file_size = len(content)

    book = Book(
        title=title,
        author=author,
        category=category,
        description=description,
        isbn=isbn or None,
        published_year=published_year,
        file_key=file_key,
        file_type=file_type,
        file_size=file_size,
        uploaded_by=current_admin.id,
    )
    db.add(book)
    db.commit()
    db.refresh(book)
    return book


@router.put("/books/{book_id}", response_model=BookResponse)
async def update_book(
    book_id: int,
    title: Optional[str] = Form(None),
    author: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    isbn: Optional[str] = Form(None),
    published_year: Optional[int] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    if title is not None:
        book.title = title
    if author is not None:
        book.author = author
    if category is not None:
        book.category = category
    if description is not None:
        book.description = description
    if isbn is not None:
        book.isbn = isbn
    if published_year is not None:
        book.published_year = published_year

    if file and file.filename:
        content = await file.read()
        size_mb = len(content) / (1024 * 1024)
        if size_mb > MAX_FILE_SIZE_MB:
            raise HTTPException(status_code=413, detail=f"File exceeds {MAX_FILE_SIZE_MB} MB limit")

        ct = file.content_type or ""
        if ct not in ALLOWED_FILE_TYPES:
            raise HTTPException(status_code=415, detail=f"Unsupported file type '{ct}'")

        # Delete old file if present
        if book.file_key:
            storage_service.delete_file(book.file_key)

        book.file_key = storage_service.upload_file(content, file.filename, ct)
        book.file_type = ct
        book.file_size = len(content)

    book.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(book)
    return book


@router.delete("/books/{book_id}", status_code=204)
def delete_book(
    book_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    if book.file_key:
        storage_service.delete_file(book.file_key)

    db.delete(book)
    db.commit()


# ─── Download Requests ────────────────────────────────────────────────────────

@router.get("/download-requests", response_model=List[DownloadRequestResponse])
def list_requests(
    status: Optional[RequestStatus] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    query = db.query(DownloadRequest)
    if status:
        query = query.filter(DownloadRequest.status == status)
    return query.order_by(DownloadRequest.requested_at.desc()).offset(skip).limit(limit).all()


@router.patch("/download-requests/{request_id}/approve", response_model=DownloadRequestResponse)
def approve_request(
    request_id: int,
    payload: ReviewAction,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    req = db.query(DownloadRequest).filter(DownloadRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != RequestStatus.PENDING:
        raise HTTPException(status_code=400, detail="Request is not pending")

    req.status = RequestStatus.APPROVED
    req.reviewed_by = current_admin.id
    req.reviewed_at = datetime.utcnow()
    req.review_note = payload.review_note
    db.commit()
    db.refresh(req)
    return req


@router.patch("/download-requests/{request_id}/decline", response_model=DownloadRequestResponse)
def decline_request(
    request_id: int,
    payload: ReviewAction,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    req = db.query(DownloadRequest).filter(DownloadRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != RequestStatus.PENDING:
        raise HTTPException(status_code=400, detail="Request is not pending")

    req.status = RequestStatus.DECLINED
    req.reviewed_by = current_admin.id
    req.reviewed_at = datetime.utcnow()
    req.review_note = payload.review_note
    db.commit()
    db.refresh(req)
    return req


# ─── Download History ────────────────────────────────────────────────────────

@router.get("/download-history", response_model=List[DownloadHistoryResponse])
def admin_download_history(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return (
        db.query(DownloadHistory)
        .order_by(DownloadHistory.downloaded_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


# ─── Book Upload Requests ─────────────────────────────────────────────────────

@router.get("/upload-requests", response_model=List[BookUploadRequestResponse])
def list_upload_requests(
    status: Optional[UploadRequestStatus] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    query = db.query(BookUploadRequest)
    if status:
        query = query.filter(BookUploadRequest.status == status)
    return query.order_by(BookUploadRequest.requested_at.desc()).offset(skip).limit(limit).all()


@router.patch("/upload-requests/{req_id}/approve", response_model=BookUploadRequestResponse)
def approve_upload_request(
    req_id: int,
    payload: UploadReviewAction,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    req = db.query(BookUploadRequest).filter(BookUploadRequest.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != UploadRequestStatus.PENDING:
        raise HTTPException(status_code=400, detail="Request is not pending")

    req.status = UploadRequestStatus.APPROVED
    req.reviewed_by = current_admin.id
    req.reviewed_at = datetime.utcnow()
    req.admin_note = payload.admin_note
    db.commit()
    db.refresh(req)
    return req


@router.patch("/upload-requests/{req_id}/decline", response_model=BookUploadRequestResponse)
def decline_upload_request(
    req_id: int,
    payload: UploadReviewAction,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    req = db.query(BookUploadRequest).filter(BookUploadRequest.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != UploadRequestStatus.PENDING:
        raise HTTPException(status_code=400, detail="Request is not pending")

    req.status = UploadRequestStatus.DECLINED
    req.reviewed_by = current_admin.id
    req.reviewed_at = datetime.utcnow()
    req.admin_note = payload.admin_note
    db.commit()
    db.refresh(req)
    return req
