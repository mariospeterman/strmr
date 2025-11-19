import { LiveKitRoom, RoomAudioRenderer, VideoConference } from '@livekit/components-react';
import { useEffect, useState } from 'react';

interface LiveSessionProps {
  token?: string;
  serverUrl?: string;
  onDisconnected?: () => void;
}

export const LiveSession = ({ token, serverUrl, onDisconnected }: LiveSessionProps) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(Boolean(token && serverUrl));
  }, [token, serverUrl]);

  if (!ready || !token || !serverUrl) {
    return <p>Requesting session...</p>;
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect
      continuity={true}
      onDisconnected={onDisconnected}
      data-lk-theme="default"
    >
      <VideoConference />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
};
