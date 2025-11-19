import Stripe from 'stripe';
import type { AppEnv } from '../config/env';

export type StripeBillingService = ReturnType<typeof createStripeBillingService>;

export const createStripeBillingService = (env: AppEnv) => {
  const client = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16'
  });

  const ensureCustomer = async (tenantId: string, email: string, name?: string) => {
    const existing = await client.customers.search({ query: `metadata['tenantId']:'${tenantId}' AND email:'${email}'` });
    if (existing.data[0]) return existing.data[0];

    return client.customers.create({
      email,
      name,
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

  const ensureCreatorPrice = async (creatorId: string, displayName: string, amountCents: number) => {
    const existingProducts = await client.products.search({ query: `metadata['creatorId']:'${creatorId}'` });
    let product = existingProducts.data[0];
    if (!product) {
      product = await client.products.create({
        name: `Creator ${displayName}`,
        metadata: { creatorId }
      });
    }

    const prices = await client.prices.search({ query: `metadata['creatorId']:'${creatorId}' AND active:'true'` });
    let price = prices.data.find((p) => p.unit_amount === amountCents);
    if (!price) {
      price = await client.prices.create({
        currency: 'usd',
        unit_amount: amountCents,
        recurring: { interval: 'month', usage_type: 'metered' },
        product: product.id,
        metadata: { creatorId }
      });
    }

    return { product, price };
  };

  const createCheckoutSession = async (params: { customerId: string; priceId: string; successUrl: string; cancelUrl: string; creatorId: string }) => {
    return client.checkout.sessions.create({
      customer: params.customerId,
      mode: 'subscription',
      line_items: [
        {
          price: params.priceId,
          quantity: 1
        }
      ],
      metadata: {
        creatorId: params.creatorId
      },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      subscription_data: {
        metadata: {
          creatorId: params.creatorId
        }
      }
    });
  };

  const createBillingPortalSession = async (customerId: string, returnUrl: string) => {
    return client.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl
    });
  };

  return {
    client,
    ensureCustomer,
    recordUsage,
    createPreAuthorization,
    ensureCreatorPrice,
    createCheckoutSession,
    createBillingPortalSession
  };
};
