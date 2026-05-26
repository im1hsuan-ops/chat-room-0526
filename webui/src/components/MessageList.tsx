import { useEffect, useMemo, useRef } from 'react';
import type { ServerMessage } from '../types';
import { MessageItem, SystemRow } from './MessageItem';
import { callsignColor } from '../utils/avatar';

interface EmptyStateProps {
  callsign: string;
}

function EmptyState({ callsign }: EmptyStateProps) {
  return (
    <div className="relay-empty">
      <div className="relay-empty-orbit" aria-hidden="true">
        <span className="relay-empty-planet"></span>
        <span className="relay-empty-ring relay-empty-ring-1"></span>
        <span className="relay-empty-ring relay-empty-ring-2"></span>
        <span className="relay-empty-blip relay-empty-blip-1"></span>
        <span className="relay-empty-blip relay-empty-blip-2"></span>
        <span className="relay-empty-blip relay-empty-blip-3"></span>
      </div>
      <div className="relay-empty-title">
        You're on the air,{' '}
        <span style={{ color: callsignColor(callsign) }}>@{callsign}</span>
      </div>
      <div className="relay-empty-sub">
        Nobody's talking yet. Say hi and someone will pick up the signal.
      </div>
      <div className="relay-empty-tips">
        <div className="relay-empty-tip"><b>be kind</b> — strangers are listening</div>
        <div className="relay-empty-tip"><b>be quick</b> — nothing here is saved</div>
        <div className="relay-empty-tip"><b>be you</b> — but not <i>too</i> you</div>
      </div>
    </div>
  );
}

interface TypingRowProps {
  names: string[];
}

function TypingRow({ names }: TypingRowProps) {
  if (names.length === 0) return null;
  const label =
    names.length === 1 ? `${names[0]} is keying up` :
    names.length === 2 ? `${names[0]} & ${names[1]} are keying up` :
    `${names.length} people keying up`;
  return (
    <div className="relay-typing">
      <span className="relay-typing-dots"><i></i><i></i><i></i></span>
      <span>{label}</span>
    </div>
  );
}

interface MessageListProps {
  messages: ServerMessage[];
  callsign: string;
  typing: string[];
}

export function MessageList({ messages, callsign, typing }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  const items = useMemo(() => {
    const out: { m: ServerMessage; isFirstInGroup: boolean; isLastInGroup: boolean }[] = [];
    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      const prev = messages[i - 1];
      const next = messages[i + 1];
      const samePrev = prev?.type === 'message' && m.type === 'message' && prev.callsign === m.callsign;
      const sameNext = next?.type === 'message' && m.type === 'message' && next.callsign === m.callsign;
      out.push({ m, isFirstInGroup: !samePrev, isLastInGroup: !sameNext });
    }
    return out;
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="relay-chat-scroll" ref={scrollRef}>
        <EmptyState callsign={callsign} />
      </div>
    );
  }

  return (
    <div className="relay-chat-scroll" ref={scrollRef}>
      <div className="relay-msgs">
        {items.map(({ m, isFirstInGroup, isLastInGroup }, i) =>
          m.type === 'system' ? (
            <SystemRow key={i} event={m} />
          ) : (
            <MessageItem
              key={i}
              message={m}
              isOwn={m.callsign === callsign}
              isFirstInGroup={isFirstInGroup}
              isLastInGroup={isLastInGroup}
            />
          ),
        )}
        <TypingRow names={typing} />
      </div>
    </div>
  );
}
