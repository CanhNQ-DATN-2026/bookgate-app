import io
import uuid
from datetime import timedelta
from urllib.parse import urlparse
from minio import Minio
from minio.error import S3Error
from ..core.config import settings


class StorageService:
    """
    Abstraction over MinIO (S3-compatible).
    To migrate to AWS S3, swap the Minio client for boto3 and adjust presigned URL generation.
    """

    def __init__(self):
        # Internal client — connects via Docker-internal hostname (e.g. minio:9000).
        # Used for uploads, deletes, bucket management.
        self.client = Minio(
            endpoint=settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )

        # Public client — used ONLY for presigned URL generation.
        # Must use the browser-accessible host (e.g. localhost:9000) so the
        # HMAC signature is computed against the same host the browser will send.
        parsed = urlparse(settings.MINIO_PUBLIC_URL)
        public_endpoint = parsed.netloc  # "localhost:9000"
        public_secure = parsed.scheme == "https"

        self.public_client = Minio(
            endpoint=public_endpoint,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=public_secure,
        )

        self.bucket = settings.MINIO_BUCKET_NAME

        # Pre-seed the region cache so the public client never makes a network call
        # to detect the bucket region. localhost:9000 is unreachable from inside the
        # container; MinIO always uses "us-east-1" anyway.
        self.public_client._region_map[self.bucket] = "us-east-1"

    def ensure_bucket(self):
        """Create the bucket if it does not exist. Called once on startup."""
        try:
            if not self.client.bucket_exists(self.bucket):
                self.client.make_bucket(self.bucket)
                print(f"[storage] Created bucket '{self.bucket}'")
            else:
                print(f"[storage] Bucket '{self.bucket}' already exists")
            # Keep region cache in sync after bucket is confirmed
            self.public_client._region_map[self.bucket] = "us-east-1"
        except S3Error as e:
            print(f"[storage] Error ensuring bucket: {e}")
            raise

    def upload_file(self, file_bytes: bytes, filename: str, content_type: str) -> str:
        """Upload file bytes and return the object key."""
        ext = filename.rsplit(".", 1)[-1] if "." in filename else "bin"
        object_key = f"books/{uuid.uuid4().hex}.{ext}"
        self.client.put_object(
            bucket_name=self.bucket,
            object_name=object_key,
            data=io.BytesIO(file_bytes),
            length=len(file_bytes),
            content_type=content_type,
        )
        return object_key

    def get_presigned_url(self, object_key: str, expires_hours: int = 1) -> str:
        """
        Generate a presigned download URL signed for the public-facing endpoint.
        The region is pre-cached so no network call is made from inside the container.
        """
        return self.public_client.presigned_get_object(
            bucket_name=self.bucket,
            object_name=object_key,
            expires=timedelta(hours=expires_hours),
        )

    def delete_file(self, object_key: str):
        """Delete an object from storage."""
        try:
            self.client.remove_object(self.bucket, object_key)
        except S3Error as e:
            print(f"[storage] Error deleting {object_key}: {e}")


storage_service = StorageService()
