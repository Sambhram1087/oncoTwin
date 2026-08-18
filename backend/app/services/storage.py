"""
Storage abstraction.

`save_upload` currently writes to local disk under settings.UPLOAD_DIR.

Production swap: replace the body of `save_upload` with a call to
Supabase Storage, e.g.:

    supabase.storage.from_("mri-uploads").upload(dest_path, file_bytes)

and return the bucket path/URL instead of a local filesystem path. Every
caller only depends on `save_upload` returning a string path/identifier,
so no other code needs to change.
"""
import os
import uuid

from fastapi import UploadFile

from app.core.config import get_settings

settings = get_settings()


ALLOWED_EXTENSIONS = {".nii", ".gz", ".zip"}


def validate_upload_filename(filename: str) -> bool:
    lower = filename.lower()
    return (
        lower.endswith(".nii")
        or lower.endswith(".nii.gz")
        or lower.endswith(".zip")
    )


async def save_upload(file: UploadFile, patient_id: int) -> str:
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    patient_dir = os.path.join(settings.UPLOAD_DIR, f"patient_{patient_id}")
    os.makedirs(patient_dir, exist_ok=True)

    unique_name = f"{uuid.uuid4().hex}_{file.filename}"
    dest_path = os.path.join(patient_dir, unique_name)

    contents = await file.read()
    with open(dest_path, "wb") as f:
        f.write(contents)

    return dest_path
