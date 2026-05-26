import type { ConnectionStatus } from '../types';

interface StatusIndicatorProps {
  status: ConnectionStatus;
}

const STATUS_MAP: Record<ConnectionStatus, { color: string; label: string; pulse: boolean }> = {
  connected:    { color: 'var(--mint)',   label: 'Live',         pulse: false },
  connecting:   { color: 'var(--butter)', label: 'Connecting',   pulse: true  },
  reconnecting: { color: 'var(--butter)', label: 'Reconnecting', pulse: true  },
  disconnected: { color: 'var(--coral)',  label: 'Offline',      pulse: false },
};

export function StatusIndicator({ status }: StatusIndicatorProps) {
  const m = STATUS_MAP[status];
  return (
    <div className="relay-status" data-status={status}>
      <span className="relay-status-dot" style={{ background: m.color }}>
        {m.pulse && <span className="relay-status-pulse" style={{ background: m.color }}></span>}
      </span>
      <span className="relay-status-label">{m.label}</span>
    </div>
  );
}
