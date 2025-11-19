import { useState } from 'react';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { sendTip } from '../lib/api';

interface TipFormProps {
  sessionId?: string;
  authToken: string;
}

export const TipForm = ({ sessionId, authToken }: TipFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [amount, setAmount] = useState(500);
  const [status, setStatus] = useState<string | null>(null);

  const submitTip = async () => {
    if (!stripe || !elements || !sessionId) return;
    const card = elements.getElement(CardElement);
    if (!card) return;
    setStatus('Processing tip…');
    const { paymentMethod, error } = await stripe.createPaymentMethod({ type: 'card', card });
    if (error || !paymentMethod) {
      setStatus(error?.message ?? 'Unable to tokenize card');
      return;
    }
    try {
      await sendTip(authToken, { sessionId, amountCents: amount, paymentMethodId: paymentMethod.id });
      setStatus('Tip sent!');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Unable to send tip');
    }
  };

  return (
    <div className="tip-form">
      <label>Send a tip</label>
      <input type="number" min={100} step={100} value={amount} onChange={(e) => setAmount(parseInt(e.target.value, 10))} />
      <CardElement options={{ hidePostalCode: true }} />
      <button onClick={submitTip} disabled={!sessionId}>
        Send Tip
      </button>
      {status && <p>{status}</p>}
    </div>
  );
};
