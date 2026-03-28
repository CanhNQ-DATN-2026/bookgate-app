"""
Bootstrap script — creates the initial admin account if it does not exist.
Safe to run multiple times (idempotent).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.core.config import settings
from app.models.user import User, UserRole


def seed():
    db = SessionLocal()
    try:
        _seed_admin(db)
        db.commit()
        print("[seed] Done.")
    except Exception as e:
        db.rollback()
        print(f"[seed] Error: {e}")
        raise
    finally:
        db.close()


def _seed_admin(db):
    existing = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
    if not existing:
        admin = User(
            full_name=settings.ADMIN_FULL_NAME,
            email=settings.ADMIN_EMAIL,
            password_hash=get_password_hash(settings.ADMIN_PASSWORD),
            role=UserRole.ADMIN,
        )
        db.add(admin)
        print(f"[seed] Created admin: {settings.ADMIN_EMAIL}")
    else:
        print(f"[seed] Admin already exists: {settings.ADMIN_EMAIL}")


if __name__ == "__main__":
    seed()
