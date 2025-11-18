from __future__ import annotations

from openai import OpenAI

from ..config import get_settings


class PersonaLLM:
    def __init__(self):
        settings = get_settings()
        self.client = OpenAI(api_key=settings.openai_api_key)

    def generate(self, prompt: str, persona: dict | None = None) -> str:
        system = persona.get("system_prompt") if persona else "You are a helpful AI influencer."
        completion = self.client.responses.create(
            model="gpt-4o-mini",
            input=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
        )
        return completion.output[0].content[0].text  # type: ignore[index]
