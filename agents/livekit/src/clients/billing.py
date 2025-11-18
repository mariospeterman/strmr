from __future__ import annotations

import stripe

from ..config import get_settings


class BillingClient:
    def __init__(self):
        settings = get_settings()
        stripe.api_key = settings.stripe_secret_key

    def record_usage(self, customer_id: str, meter_event: str, quantity: float):
        stripe.meter_events.create(
            customer=customer_id,
            event_name=meter_event,
            payload={"quantity": quantity},
        )
