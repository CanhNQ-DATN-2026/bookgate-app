import io
import uuid
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from ..core.config import settings


class StorageService:
    """S3-backed object storage. Credentials via IRSA on EKS."""

    def __init__(self):
        self.bucket = settings.S3_BUCKET_NAME
        self._client = boto3.client(
            "s3",
            region_name=settings.AWS_DEFAULT_REGION,
            config=Config(signature_version="s3v4"),
        )

    def upload_file(self, file_bytes: bytes, filename: str, content_type: str) -> str:
        """Upload file bytes and return the object key."""
        ext = filename.rsplit(".", 1)[-1] if "." in filename else "bin"
        object_key = f"books/{uuid.uuid4().hex}.{ext}"
        self._client.put_object(
            Bucket=self.bucket,
            Key=object_key,
            Body=io.BytesIO(file_bytes),
            ContentLength=len(file_bytes),
            ContentType=content_type,
        )
        return object_key

    def get_presigned_url(self, object_key: str, expires_hours: int = 1) -> str:
        """Generate a presigned download URL valid for the given number of hours."""
        return self._client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": object_key},
            ExpiresIn=expires_hours * 3600,
        )

    def delete_file(self, object_key: str):
        """Delete an object from storage."""
        try:
            self._client.delete_object(Bucket=self.bucket, Key=object_key)
        except ClientError as e:
            print(f"[storage] Error deleting {object_key}: {e}")


storage_service = StorageService()
