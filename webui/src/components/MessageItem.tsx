import type { ChatMessage, SystemEvent } from '../types';
import { Avatar } from './Avatar';
import { callsignColor } from '../utils/avatar';

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

interface MessageItemProps {
  message: ChatMessage;
  isOwn: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
}

export function MessageItem({ message, isOwn, isFirstInGroup, isLastInGroup }: MessageItemProps) {
  const time = formatTime(message.timestamp);
  const cs = callsignColor(message.callsign);

  const cls = [
    'relay-msg',
    isOwn ? 'is-own' : 'is-other',
    isFirstInGroup ? 'is-first' : '',
    isLastInGroup ? 'is-last' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={cls}>
      <div className="relay-msg-gutter">
        {isFirstInGroup && !isOwn && <Avatar name={message.callsign} size={36} />}
      </div>
      <div className="relay-msg-body">
        {isFirstInGroup && (
          <div className="relay-msg-meta">
            <span className="relay-msg-name" style={isOwn ? undefined : { color: cs }}>
              {isOwn ? 'You' : message.callsign}
            </span>
            <span className="relay-msg-time">{time}</span>
            {message.failed && <span className="relay-msg-failed">· failed to send</span>}
          </div>
        )}
        <div
          className="relay-msg-bubble"
          style={!isOwn ? { borderLeftColor: cs } : undefined}
        >
          {message.text}
        </div>
      </div>
    </div>
  );
}

interface SystemRowProps {
  event: SystemEvent;
}

export function SystemRow({ event }: SystemRowProps) {
  const verb = event.event === 'user_joined' ? 'tuned in' : 'signed off';
  const symbol = event.event === 'user_joined' ? '↘' : '↗';
  return (
    <div className="relay-system">
      <span className="relay-system-sym">{symbol}</span>
      <span className="relay-system-name" style={{ color: callsignColor(event.callsign) }}>
        {event.callsign}
      </span>
      <span className="relay-system-verb">{verb}</span>
    </div>
  );
}
