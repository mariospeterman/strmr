import Stripe from 'stripe';
import type { AppEnv } from '../config/env';

export type StripeBillingService = ReturnType<typeof createStripeBillingService>;

export const createStripeBillingService = (env: AppEnv) => {
  const client = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16'
  });

  const ensureCustomer = async (tenantId: string, email: string) => {
    const existing = await client.customers.search({ query: `metadata['tenantId']:'${tenantId}' AND email:'${email}'` });
    if (existing.data[0]) return existing.data[0];

    return client.customers.create({
      email,
      metadata: { tenantId }
    });
  };

  const recordUsage = async (meterEvent: string, quantity: number, customerId: string) => {
    await client.meterEvents.create({
      customer: customerId,
      event_name: meterEvent,
      payload: { quantity }
    });
  };

  const createPreAuthorization = async (customerId: string, priceId: string) => {
    return client.paymentIntents.create({
      customer: customerId,
      amount: 0,
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: { priceId }
    });
  };

  return {
    client,
    ensureCustomer,
    recordUsage,
    createPreAuthorization
  };
};
