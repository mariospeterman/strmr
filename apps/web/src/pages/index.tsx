import { useState } from 'react';
import Head from 'next/head';
import { CreatorCard } from '../components/CreatorCard';
import { LiveSession } from '../components/LiveSession';
import { createSession } from '../lib/api';

const creators = [
  { id: 'creator-1', name: 'Ava Synth', pricePerMin: 500, live: true },
  { id: 'creator-2', name: 'Neo Pulse', pricePerMin: 300, live: false }
];

export default function Home() {
  const [token, setToken] = useState<string>();
  const [roomUrl, setRoomUrl] = useState<string>();
  const [loading, setLoading] = useState(false);

  const startSession = async (creatorId: string) => {
    setLoading(true);
    try {
      const session = await createSession(creatorId);
      setToken(session.joinTokens.fan);
      setRoomUrl(process.env.NEXT_PUBLIC_LIVEKIT_URL);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>strmr.ai</title>
      </Head>
      <main>
        <section>
          <h1>AI Avatar Streams</h1>
          <p>Select a creator to start a low-latency LiveKit session.</p>
          <div className="grid">
            {creators.map((creator) => (
              <CreatorCard key={creator.id} {...creator} onStart={startSession} />
            ))}
          </div>
        </section>
        <section>
          <h2>Live Session</h2>
          {loading ? <p>Spinning up session...</p> : <LiveSession token={token} serverUrl={roomUrl} />}
        </section>
      </main>
    </>
  );
}
