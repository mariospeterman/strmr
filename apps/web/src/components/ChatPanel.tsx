import { FormEvent, useEffect, useRef, useState } from 'react';

interface ChatMessage {
  id: string;
  text: string;
  from: string;
  type?: string;
}

interface ChatPanelProps {
  sessionId?: string;
}

export const ChatPanel = ({ sessionId }: ChatPanelProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const wsRef = useRef<WebSocket>();

  useEffect(() => {
    if (!sessionId) return;
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_API_WS_URL}/chat/ws`);
    wsRef.current = ws;
    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data.toString());
      setMessages((prev) => [...prev.slice(-50), { id: crypto.randomUUID(), text: payload.text ?? JSON.stringify(payload), from: payload.from ?? 'system', type: payload.type }]);
    };
    return () => ws.close();
  }, [sessionId]);

  const sendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!wsRef.current || !input) return;
    wsRef.current.send(JSON.stringify({ text: input, sessionId }));
    setInput('');
  };

  return (
    <div className="chat">
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`msg ${msg.type === 'chat.moderation' ? 'flagged' : ''}`}>
            <strong>{msg.from}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Say something" />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};
