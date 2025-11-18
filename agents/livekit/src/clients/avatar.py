from __future__ import annotations

import httpx

from ..config import get_settings


class BeyondPresenceClient:
    def __init__(self):
        self.settings = get_settings()
        self.http = httpx.AsyncClient()

    async def start_session(self, persona_id: str, voice_config: dict | None = None) -> dict:
        response = await self.http.post(
            "https://api.beyondpresence.ai/session/start",
            headers={"Authorization": f"Bearer {self.settings.beyond_presence_api_key}"},
            json={"personaId": persona_id, "voice": voice_config or {}},
        )
        response.raise_for_status()
        return response.json()

    async def send_phonemes(self, session_id: str, phonemes: list[dict]):
        await self.http.post(
            f"https://api.beyondpresence.ai/session/{session_id}/phonemes",
            headers={"Authorization": f"Bearer {self.settings.beyond_presence_api_key}"},
            json={"phonemes": phonemes},
        )

    async def close(self):
        await self.http.aclose()
