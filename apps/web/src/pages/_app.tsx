import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import '@livekit/components-styles';
import '../styles.css';
import { AuthProvider } from '../context/AuthContext';

const queryClient = new QueryClient();
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Elements stripe={stripePromise}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Component {...pageProps} />
        </AuthProvider>
      </QueryClientProvider>
    </Elements>
  );
}
