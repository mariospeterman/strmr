from __future__ import annotations

import json
import os
import tempfile
from pathlib import Path
from typing import BinaryIO

import boto3
from botocore.client import BaseClient

from ..config import get_settings


class ObjectStoreClient:
  def __init__(self, bucket: str | None = None):
    settings = get_settings()
    self.bucket = bucket or settings.object_store_bucket
    self._client: BaseClient = boto3.client('s3')

  def upload_bytes(self, key: str, data: bytes, content_type: str = 'application/octet-stream') -> str:
    self._client.put_object(Bucket=self.bucket, Key=key, Body=data, ContentType=content_type)
    return f's3://{self.bucket}/{key}'

  def upload_file(self, key: str, file_path: Path | str) -> str:
    self._client.upload_file(str(file_path), self.bucket, key)
    return f's3://{self.bucket}/{key}'

  def upload_json(self, key: str, payload: dict) -> str:
    return self.upload_bytes(key, json.dumps(payload).encode('utf-8'), 'application/json')

  def stream_upload(self, key: str, handle: BinaryIO, content_type: str) -> str:
    self._client.upload_fileobj(handle, self.bucket, key, ExtraArgs={'ContentType': content_type})
    return f's3://{self.bucket}/{key}'

  def download_to_temp(self, key: str) -> Path:
    fd, tmp_path = tempfile.mkstemp(suffix='-strmr')
    os.close(fd)
    dest = Path(tmp_path)
    self._client.download_file(self.bucket, key, str(dest))
    return dest
