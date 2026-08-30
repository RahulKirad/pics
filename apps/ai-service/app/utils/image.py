"""Image decoding helpers."""

from __future__ import annotations

import base64

import cv2
import numpy as np
from fastapi import HTTPException, UploadFile


async def read_image_from_upload(file: UploadFile) -> np.ndarray:
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty image upload")
    return decode_image_bytes(content)


def decode_image_bytes(content: bytes) -> np.ndarray:
    array = np.frombuffer(content, dtype=np.uint8)
    image = cv2.imdecode(array, cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(status_code=400, detail="Invalid image data")
    return image


def decode_image_base64(value: str) -> np.ndarray:
    try:
        if "," in value:
            value = value.split(",", 1)[1]
        content = base64.b64decode(value)
    except Exception as error:  # noqa: BLE001
        raise HTTPException(status_code=400, detail="Invalid base64 image") from error
    return decode_image_bytes(content)
