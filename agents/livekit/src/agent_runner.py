from __future__ import annotations

import argparse
import asyncio
from loguru import logger
from livekit.agents import JobContext, JobRequest, WorkerOptions, agent_worker
from livekit.agents.media import default_audio_track

from .clients.hume import get_hume_client
from .clients.avatar import BeyondPresenceClient
from .clients.billing import BillingClient
from .config import get_settings
from .llm.router import PersonaLLM


async def handle_session(ctx: JobContext, request: JobRequest):
    settings = get_settings()
    llm = PersonaLLM()
    hume = get_hume_client()
    avatar = BeyondPresenceClient()
    billing = BillingClient()

    identity = request.identity or "agent"
    values = request.values or {}
    persona = values.get("persona", {})
    customer_id = values.get("customerId")
    persona_id = persona.get("personaId", identity)

    logger.info("Starting agent session", identity=identity)

    avatar_session = await avatar.start_session(persona_id, persona.get("voiceConfig"))
    avatar_session_id = avatar_session.get("sessionId", persona_id)

    async for event in ctx.subscribe(default_audio_track()):
        transcript = event.alternatives[0].text if event.alternatives else ""
        if not transcript:
            continue

        reply = llm.generate(transcript, persona)

        async for chunk in hume.stream_speech(reply):
            phonemes = chunk.get("phonemes", [])
            audio_b64 = chunk.get("audio")
            if phonemes:
                await avatar.send_phonemes(avatar_session_id, phonemes)
            if audio_b64:
                await ctx.publish_audio(audio_b64)

        if customer_id:
            billing.record_usage(customer_id, meter_event="live_minutes", quantity=0.25)

    await avatar.close()
    await hume.close()


async def main(room: str, identity: str):
    settings = get_settings()
    options = WorkerOptions(auto_subscribe=True)

    worker = agent_worker.create(options)

    @worker.on_startup
    async def _startup(ctx: JobContext, request: JobRequest):
        await ctx.connect(
            url=settings.livekit_url,
            api_key=settings.livekit_api_key,
            api_secret=settings.livekit_api_secret,
            room=room,
            identity=identity,
        )
        await handle_session(ctx, request)

    await worker.run()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--room", required=True)
    parser.add_argument("--identity", required=True)
    args = parser.parse_args()

    asyncio.run(main(args.room, args.identity))
