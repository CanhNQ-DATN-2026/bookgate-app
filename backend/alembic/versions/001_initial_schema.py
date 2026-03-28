"""Initial schema

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00
"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), unique=True, index=True, nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column(
            "role",
            sa.Enum("ADMIN", "USER", name="userrole"),
            nullable=False,
            server_default="USER",
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "books",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("title", sa.String(500), nullable=False, index=True),
        sa.Column("author", sa.String(255), nullable=False),
        sa.Column("category", sa.String(100), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("isbn", sa.String(20), unique=True, nullable=True),
        sa.Column("published_year", sa.Integer(), nullable=True),
        sa.Column("file_key", sa.String(500), nullable=True),
        sa.Column("file_type", sa.String(50), nullable=True),
        sa.Column("file_size", sa.BigInteger(), nullable=True),
        sa.Column("uploaded_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "download_requests",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("book_id", sa.Integer(), sa.ForeignKey("books.id"), nullable=False),
        sa.Column(
            "status",
            sa.Enum("PENDING", "APPROVED", "DECLINED", name="requeststatus"),
            nullable=False,
            server_default="PENDING",
        ),
        sa.Column("requested_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("reviewed_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(), nullable=True),
        sa.Column("review_note", sa.Text(), nullable=True),
    )

    op.create_table(
        "download_history",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("book_id", sa.Integer(), sa.ForeignKey("books.id"), nullable=False),
        sa.Column("request_id", sa.Integer(), sa.ForeignKey("download_requests.id"), nullable=False),
        sa.Column("downloaded_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("download_history")
    op.drop_table("download_requests")
    op.drop_table("books")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS requeststatus")
    op.execute("DROP TYPE IF EXISTS userrole")
