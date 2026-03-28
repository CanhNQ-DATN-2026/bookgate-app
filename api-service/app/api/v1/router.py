from fastapi import APIRouter
from .endpoints import auth, users, books, admin, upload_requests

api_router = APIRouter()

api_router.include_router(auth.router,            prefix="/auth",            tags=["Auth"])
api_router.include_router(users.router,           prefix="/users",           tags=["Users"])
api_router.include_router(books.router,           prefix="/books",           tags=["Books"])
api_router.include_router(upload_requests.router, prefix="/upload-requests", tags=["Upload Requests"])
api_router.include_router(admin.router,           prefix="/admin",           tags=["Admin"])
