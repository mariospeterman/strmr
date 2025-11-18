import { useState } from 'react';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { createSession, CreateSessionParams } from '../lib/api';

interface SessionPaywallProps {
  creatorId: string;
  onSessionReady: (token: string, roomUrl: string, sessionId: string) => void;
}

export const SessionPaywall = ({ creatorId, onSessionReady }: SessionPaywallProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [email, setEmail] = useState('fan@strmr.ai');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);
    try {
      const card = elements.getElement(CardElement);
      if (!card) throw new Error('Payment element missing');
      const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({ type: 'card', card, billing_details: { email } });
      if (pmError || !paymentMethod) {
        throw pmError ?? new Error('Unable to create payment method');
      }
      const session = await createSession({ creatorId, paymentMethodId: paymentMethod.id, customerEmail: email });
      onSessionReady(session.joinTokens.fan, process.env.NEXT_PUBLIC_LIVEKIT_URL ?? '', session.sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="paywall">
      <label>Email</label>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      <label>Payment Method</label>
      <div className="card-element">
        <CardElement options={{ style: { base: { color: '#fff' } } }} />
      </div>
      {error && <p className="error">{error}</p>}
      <button onClick={handleStart} disabled={loading}>
        {loading ? 'Authorizing…' : 'Start Session'}
      </button>
    </div>
  );
};
