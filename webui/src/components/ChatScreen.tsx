import type { ConnectionStatus, ServerMessage } from '../types';
import { Avatar } from './Avatar';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { StatusIndicator } from './StatusIndicator';

interface ChatScreenProps {
  callsign: string;
  messages: ServerMessage[];
  status: ConnectionStatus;
  retryCount: number;
  typing: string[];
  theme: 'dark' | 'light';
  onSend: (text: string) => void;
  onReconnect: () => void;
  onToggleTheme: () => void;
}

export function ChatScreen({
  callsign,
  messages,
  status,
  retryCount,
  typing,
  theme,
  onSend,
  onReconnect,
  onToggleTheme,
}: ChatScreenProps) {
  const lost = status === 'disconnected' && retryCount >= 5;

  return (
    <div className="relay-chat">
      <header className="relay-chat-hdr">
        <div className="relay-chat-brand">
          <span className="relay-brand-mark relay-brand-mark-sm">RELAY</span>
          <span className="relay-chat-channel">· open channel</span>
        </div>
        <div className="relay-chat-hdr-right">
          <StatusIndicator status={status} />
          <div className="relay-chat-me">
            <span className="relay-chat-me-cs">@{callsign}</span>
            <Avatar name={callsign} size={28} />
          </div>
          <button
            type="button"
            className="relay-btn relay-btn-tiny"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀' : '◑'}
          </button>
        </div>
      </header>

      {lost && (
        <div className="relay-banner relay-banner-lost" role="alert">
          <span>Signal lost. Couldn't reach the relay after 5 tries.</span>
          <button type="button" className="relay-btn relay-btn-tiny" onClick={onReconnect}>
            Try again
          </button>
        </div>
      )}

      {status === 'reconnecting' && !lost && (
        <div className="relay-banner relay-banner-warn" role="status" aria-live="polite">
          <span className="relay-banner-spin"></span>
          <span>Re-tuning… attempt {retryCount + 1}</span>
        </div>
      )}

      <MessageList messages={messages} callsign={callsign} typing={typing} />

      <MessageInput status={status} onSend={onSend} />
    </div>
  );
}
