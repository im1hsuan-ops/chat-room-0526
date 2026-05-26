import { useCallback, useEffect, useRef, useState } from 'react';
import { WS_ENDPOINT } from '../config';
import type { ConnectionStatus, SendMessagePayload, ServerMessage } from '../types';

const BACKOFF = [2000, 4000, 8000, 16000, 30000];
const MAX_RETRIES = 5;

interface UseWebSocketResult {
  status: ConnectionStatus;
  retryCount: number;
  messages: ServerMessage[];
  sendMessage: (text: string) => void;
  connect: (callsign: string) => void;
  disconnect: () => void;
  reconnect: () => void;
}

export function useWebSocket(): UseWebSocketResult {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [retryCount, setRetryCount] = useState(0);
  const [messages, setMessages] = useState<ServerMessage[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const callsignRef = useRef<string>('');
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intentionalRef = useRef(false);

  const clearRetryTimer = () => {
    if (retryTimerRef.current !== null) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  };

  const openConnection = useCallback((callsign: string) => {
    if (wsRef.current) {
      intentionalRef.current = true;
      wsRef.current.close();
      wsRef.current = null;
    }

    const url = `${WS_ENDPOINT}?callsign=${encodeURIComponent(callsign)}`;
    setStatus('connecting');

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      retryCountRef.current = 0;
      setRetryCount(0);
      setStatus('connected');
      intentionalRef.current = false;
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string) as ServerMessage;
        setMessages((prev) => [...prev, data]);
      } catch {
        // malformed message — ignore
      }
    };

    ws.onclose = () => {
      if (intentionalRef.current) return;

      const count = retryCountRef.current;
      if (count >= MAX_RETRIES) {
        setStatus('disconnected');
        setRetryCount(count);
        return;
      }

      setStatus('reconnecting');
      const delay = BACKOFF[Math.min(count, BACKOFF.length - 1)];
      retryCountRef.current = count + 1;
      setRetryCount(count + 1);

      retryTimerRef.current = setTimeout(() => {
        openConnection(callsignRef.current);
      }, delay);
    };

    ws.onerror = () => {
      // onerror is always followed by onclose; handle reconnect there
    };
  }, []);

  const connect = useCallback(
    (callsign: string) => {
      callsignRef.current = callsign;
      retryCountRef.current = 0;
      setRetryCount(0);
      setMessages([]);
      intentionalRef.current = false;
      openConnection(callsign);
    },
    [openConnection],
  );

  const disconnect = useCallback(() => {
    clearRetryTimer();
    intentionalRef.current = true;
    wsRef.current?.close();
    wsRef.current = null;
    setStatus('disconnected');
  }, []);

  const reconnect = useCallback(() => {
    clearRetryTimer();
    retryCountRef.current = 0;
    setRetryCount(0);
    openConnection(callsignRef.current);
  }, [openConnection]);

  const sendMessage = useCallback((text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    const payload: SendMessagePayload = { action: 'sendMessage', text };
    wsRef.current.send(JSON.stringify(payload));
  }, []);

  useEffect(() => {
    return () => {
      clearRetryTimer();
      intentionalRef.current = true;
      wsRef.current?.close();
    };
  }, []);

  return { status, retryCount, messages, sendMessage, connect, disconnect, reconnect };
}
