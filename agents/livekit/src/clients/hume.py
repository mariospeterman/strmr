from __future__ import annotations

import asyncio
import httpx
from typing import AsyncGenerator

from ..config import get_settings


class HumeEVIClient:
    def __init__(self):
        self.settings = get_settings()
        self.http = httpx.AsyncClient()

    async def stream_speech(self, text: str) -> AsyncGenerator[dict, None]:
        async with self.http.stream(
            "POST",
            "https://api.hume.ai/v0/evi/s2s",
            headers={"X-Hume-Api-Key": self.settings.hume_api_key},
            json={"text": text},
        ) as response:
            async for chunk in response.aiter_lines():
                if chunk:
                    yield httpx.Response(200, content=chunk).json()

    async def close(self):
        await self.http.aclose()


_hume_client: HumeEVIClient | None = None


def get_hume_client() -> HumeEVIClient:
    global _hume_client
    if not _hume_client:
        _hume_client = HumeEVIClient()
    return _hume_client
