import { LiveKitRoom, VideoRenderer, useTracks, AudioRenderer } from '@livekit/components-react';
import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';
import { useEffect, useState } from 'react';

interface LiveSessionProps {
  token?: string;
  serverUrl?: string;
}

const Tracks = () => {
  const tracks = useTracks([{ source: 'camera' }, { source: 'microphone' }]);
  return (
    <>
      {tracks.map((track: TrackReferenceOrPlaceholder) => (
        <div key={track.publication?.trackSid} className="track">
          {track.publication?.kind === 'video' ? <VideoRenderer trackRef={track} /> : <AudioRenderer trackRef={track} />}
        </div>
      ))}
    </>
  );
};

export const LiveSession = ({ token, serverUrl }: LiveSessionProps) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(Boolean(token && serverUrl));
  }, [token, serverUrl]);

  if (!ready || !token || !serverUrl) {
    return <p>Requesting session...</p>;
  }

  return (
    <LiveKitRoom token={token} serverUrl={serverUrl} connect>
      <Tracks />
    </LiveKitRoom>
  );
};
