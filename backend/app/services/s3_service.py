from botocore.config import Config
from dotenv import load_dotenv
load_dotenv()

import boto3
import os

s3 = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION"),
    endpoint_url=f"https://s3.{os.getenv('AWS_REGION')}.amazonaws.com",
    config=Config(
        signature_version="s3v4",
        s3={"addressing_style": "virtual"}
    )
)

BUCKET_NAME = os.getenv("AWS_BUCKET_NAME")


def generate_upload_url(filename: str, content_type: str):
    object_key = f"uploads/{filename}"

    upload_url = s3.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": BUCKET_NAME,
            "Key": object_key
        },
        ExpiresIn=3600
    )

    file_url = (
        f"https://{BUCKET_NAME}.s3."
        f"{os.getenv('AWS_REGION')}.amazonaws.com/"
        f"{object_key}"
    )

    return {
        "uploadUrl": upload_url,
        "objectKey": object_key,
        "fileUrl": file_url,
        "contentType": content_type
    }