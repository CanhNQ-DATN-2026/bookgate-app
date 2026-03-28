"""Add user_note to download_requests and book_upload_requests table

Revision ID: 002
Revises: 001
Create Date: 2024-01-02 00:00:00
"""
from typing import Sequence, Union
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM as PgEnum
from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("download_requests", sa.Column("user_note", sa.Text(), nullable=True))

    # Create enum type safely — no-op if it already exists from a partial run
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE uploadrequeststatus AS ENUM ('PENDING', 'APPROVED', 'DECLINED');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    op.create_table(
        "book_upload_requests",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("author", sa.String(255), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("user_note", sa.Text(), nullable=True),
        sa.Column("admin_note", sa.Text(), nullable=True),
        sa.Column(
            "status",
            PgEnum("PENDING", "APPROVED", "DECLINED", name="uploadrequeststatus", create_type=False),
            nullable=False,
            server_default="PENDING",
        ),
        sa.Column("requested_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("reviewed_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("book_upload_requests")
    op.execute("DROP TYPE IF EXISTS uploadrequeststatus")
    op.drop_column("download_requests", "user_note")
