from __future__ import annotations

import asyncio
from pathlib import Path
from typing import List

from openai import OpenAI

from ..config import get_settings


class ASRPipeline:
    def __init__(self) -> None:
        self.settings = get_settings()
        if not self.settings.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY is required for ASR")
        self.client = OpenAI(api_key=self.settings.openai_api_key)

    async def transcribe(self, audio_path: Path) -> List[str]:
        loop = asyncio.get_running_loop()
        def _run() -> str:
            with audio_path.open('rb') as handle:
                response = self.client.audio.transcriptions.create(
                    model='gpt-4o-mini-transcribe',
                    file=handle
                )
                return response.text
        transcript = await loop.run_in_executor(None, _run)
        return [segment.strip() for segment in transcript.split('\n') if segment.strip()]
