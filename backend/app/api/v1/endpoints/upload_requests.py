"""User-facing endpoints for requesting admin to upload a specific book."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ....core.database import get_db
from ....core.deps import get_current_user
from ....models.user import User
from ....models.book_upload_request import BookUploadRequest, UploadRequestStatus
from ....schemas.book_upload_request import BookUploadRequestCreate, BookUploadRequestResponse

router = APIRouter()


@router.post("", response_model=BookUploadRequestResponse, status_code=status.HTTP_201_CREATED)
def create_upload_request(
    payload: BookUploadRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """User requests admin to upload a specific book."""
    # Prevent duplicate pending requests for same title
    existing = db.query(BookUploadRequest).filter(
        BookUploadRequest.user_id == current_user.id,
        BookUploadRequest.title.ilike(payload.title.strip()),
        BookUploadRequest.status == UploadRequestStatus.PENDING,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="You already have a pending request for this title")

    req = BookUploadRequest(
        user_id=current_user.id,
        title=payload.title.strip(),
        author=payload.author,
        description=payload.description,
        user_note=payload.user_note,
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


@router.get("", response_model=List[BookUploadRequestResponse])
def get_my_upload_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(BookUploadRequest)
        .filter(BookUploadRequest.user_id == current_user.id)
        .order_by(BookUploadRequest.requested_at.desc())
        .all()
    )
