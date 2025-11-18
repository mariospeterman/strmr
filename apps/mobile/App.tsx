import { useEffect, useState } from 'react';
import { SafeAreaView, Text, Button, StyleSheet } from 'react-native';
import { Room, connect } from 'livekit-client';

const room = new Room();

export default function App() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  const startSession = async () => {
    setLoading(true);
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creatorId: 'creator-1', paymentMethodId: 'pm_mobile', customerEmail: 'fan@strmr.ai' })
    });
    const data = await response.json();
    const token = data.joinTokens.fan;
    await connect(room, process.env.EXPO_PUBLIC_LIVEKIT_URL ?? '', token);
    setConnected(true);
    setLoading(false);
  };

  useEffect(() => {
    return () => {
      room.disconnect();
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Mobile AI Avatar Client</Text>
      <Button title={loading ? 'Starting...' : connected ? 'Connected' : 'Start Session'} disabled={loading} onPress={startSession} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#050505'
  },
  heading: {
    color: '#fff',
    fontSize: 20,
    marginBottom: 16
  }
});
