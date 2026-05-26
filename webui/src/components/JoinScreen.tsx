import { useMemo, useState } from 'react';

const CALLSIGN_POOL = ['VioletFox', 'HAM_42', 'NightOwl', 'PixelKid', 'EchoBravo', 'Sundial', 'CoolDog', 'Mothdust'];

function validateCallsign(value: string): string | null {
  if (!value) return 'Pick a callsign to broadcast under.';
  if (value.length > 20) return 'Max 20 characters.';
  if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Letters, numbers, underscore only.';
  return null;
}

interface JoinScreenProps {
  initialCallsign?: string;
  externalError?: string | null;
  busy?: boolean;
  onJoin: (callsign: string) => void;
}

export function JoinScreen({ initialCallsign = '', externalError = null, busy = false, onJoin }: JoinScreenProps) {
  const [callsign, setCallsign] = useState(initialCallsign);
  const [error, setError] = useState<string | null>(externalError);

  const suggestions = useMemo(() => {
    const seed = Date.now() % 8;
    return [CALLSIGN_POOL[seed], CALLSIGN_POOL[(seed + 3) % 8], CALLSIGN_POOL[(seed + 5) % 8]];
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = callsign.trim();
    const err = validateCallsign(trimmed);
    if (err) { setError(err); return; }
    setError(null);
    onJoin(trimmed);
  }

  function handleChange(value: string) {
    setCallsign(value);
    if (error) setError(null);
  }

  return (
    <div className="relay-join">
      <div className="relay-join-stage">
        <div className="relay-join-tower" aria-hidden="true">
          <span className="relay-wave relay-wave-1"></span>
          <span className="relay-wave relay-wave-2"></span>
          <span className="relay-wave relay-wave-3"></span>
          <span className="relay-tower-dot"></span>
        </div>

        <div className="relay-join-brand">
          <span className="relay-brand-mark">RELAY</span>
          <span className="relay-brand-tag">an open frequency · no signup</span>
        </div>

        <form className="relay-join-form" onSubmit={submit}>
          <label className="relay-join-label" htmlFor="cs">Your callsign</label>
          <div className={`relay-join-input${error ? ' is-error' : ''}`}>
            <span className="relay-join-prefix" aria-hidden="true">@</span>
            <input
              id="cs"
              type="text"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              maxLength={20}
              placeholder="VioletFox"
              value={callsign}
              onChange={(e) => handleChange(e.target.value)}
              aria-label="Callsign"
              aria-describedby={error ? 'cs-err' : 'cs-hint'}
              aria-invalid={error ? 'true' : undefined}
            />
            <span className="relay-join-count" aria-live="polite">{callsign.length}/20</span>
          </div>

          {error ? (
            <div id="cs-err" className="relay-join-err" role="alert">{error}</div>
          ) : (
            <div id="cs-hint" className="relay-join-hint">letters · numbers · _ · up to 20</div>
          )}

          <button
            className="relay-btn relay-btn-primary relay-join-go"
            type="submit"
            disabled={busy}
          >
            {busy ? 'Tuning in…' : <><span>Tune in</span> <span className="relay-btn-arrow">↘</span></>}
          </button>
        </form>

        <div className="relay-join-suggest">
          <span className="relay-join-suggest-label">or try:</span>
          {suggestions.map((s) => (
            <button key={s} type="button" className="relay-chip" onClick={() => setCallsign(s)}>
              {s}
            </button>
          ))}
        </div>

        <div className="relay-join-footer">
          anonymous · ephemeral · no accounts
        </div>
      </div>
    </div>
  );
}
