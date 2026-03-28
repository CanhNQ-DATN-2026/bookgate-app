from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ....core.database import get_db
from ....core.deps import get_current_user
from ....core.security import get_password_hash
from ....models.user import User
from ....models.download_request import DownloadRequest
from ....models.download_history import DownloadHistory
from ....schemas.user import UserUpdate, UserResponse
from ....schemas.download_request import DownloadRequestResponse
from ....schemas.download_history import DownloadHistoryResponse

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
def update_my_profile(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.email and payload.email != current_user.email:
        taken = db.query(User).filter(User.email == payload.email, User.id != current_user.id).first()
        if taken:
            raise HTTPException(status_code=400, detail="Email already in use")
        current_user.email = payload.email

    if payload.full_name is not None:
        current_user.full_name = payload.full_name

    if payload.password:
        current_user.password_hash = get_password_hash(payload.password)

    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/me/requests", response_model=List[DownloadRequestResponse])
def get_my_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    requests = (
        db.query(DownloadRequest)
        .filter(DownloadRequest.user_id == current_user.id)
        .order_by(DownloadRequest.requested_at.desc())
        .all()
    )
    return requests


@router.get("/me/download-history", response_model=List[DownloadHistoryResponse])
def get_my_download_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    history = (
        db.query(DownloadHistory)
        .filter(DownloadHistory.user_id == current_user.id)
        .order_by(DownloadHistory.downloaded_at.desc())
        .all()
    )
    return history
