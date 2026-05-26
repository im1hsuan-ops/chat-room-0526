import { useCallback, useState } from 'react';
import { JoinScreen } from './components/JoinScreen';
import { ChatScreen } from './components/ChatScreen';
import { useWebSocket } from './hooks/useWebSocket';
import './styles/relay.css';

type Screen = 'join' | 'chat';

export function App() {
  const [screen, setScreen] = useState<Screen>('join');
  const [callsign, setCallsign] = useState('');
  const [connectError, setConnectError] = useState<string | null>(null);
  const [joiningBusy, setJoiningBusy] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const { status, retryCount, messages, sendMessage, connect, reconnect } = useWebSocket();

  const handleJoin = useCallback((cs: string) => {
    setJoiningBusy(true);
    setConnectError(null);
    connect(cs);
    setCallsign(cs);
    setJoiningBusy(false);
    setScreen('chat');
  }, [connect]);

  const handleSend = useCallback((text: string) => {
    sendMessage(text);
  }, [sendMessage]);

  const handleReconnect = useCallback(() => {
    reconnect();
  }, [reconnect]);

  const handleToggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return (
    <div className="relay-frame" data-theme={theme}>
      {screen === 'join' ? (
        <JoinScreen
          initialCallsign={callsign}
          externalError={connectError}
          busy={joiningBusy}
          onJoin={handleJoin}
        />
      ) : (
        <ChatScreen
          callsign={callsign}
          messages={messages}
          status={status}
          retryCount={retryCount}
          typing={[]}
          theme={theme}
          onSend={handleSend}
          onReconnect={handleReconnect}
          onToggleTheme={handleToggleTheme}
        />
      )}
    </div>
  );
}
