import { useState } from 'react';
import type { ConnectionStatus } from '../types';

interface MessageInputProps {
  status: ConnectionStatus;
  onSend: (text: string) => void;
}

export function MessageInput({ status, onSend }: MessageInputProps) {
  const [text, setText] = useState('');
  const offline = status === 'disconnected' || status === 'reconnecting';

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  }

  return (
    <form className="relay-composer" onSubmit={submit}>
      <div className={`relay-composer-input${offline ? ' is-disabled' : ''}`}>
        <input
          type="text"
          maxLength={1000}
          placeholder={offline ? 'Waiting for signal…' : 'Broadcast to the channel'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={offline}
          aria-label="Message"
        />
        <span className="relay-composer-count">{text.length}/1000</span>
      </div>
      <button
        type="submit"
        className="relay-btn relay-btn-primary relay-composer-send"
        disabled={offline || !text.trim()}
        aria-label="Send"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12l14-7-5 14-3-6-6-1z" />
        </svg>
      </button>
    </form>
  );
}
