import React, { useEffect, useRef, useState } from 'react';
import useGame, { readLastRoom } from './hooks/useGame.js';
import useAuth from './hooks/useAuth.js';
import Lobby from './components/Lobby.jsx';
import Game from './components/Game.jsx';
import Notification from './components/Notification.jsx';
import Auth from './components/Auth.jsx';

export default function App() {
  const game = useGame();
  const auth = useAuth();
  const [guestMode, setGuestMode] = useState(false);

  const showAuth = !auth.loading && !auth.isAuthed && !guestMode;
  const ready = !auth.loading && (auth.isAuthed ? !auth.profileLoading : true);

  // Auto-rejoin: se o usuário tinha uma sala salva no localStorage, tenta voltar
  // direto pra ela em vez de mostrar a lista. Só roda 1x por sessão.
  const autoRejoinedRef = useRef(false);
  useEffect(() => {
    if (!ready || showAuth) return;
    if (game.phase !== 'connect') return;
    if (autoRejoinedRef.current) {
      game.browseRooms();
      return;
    }

    const last = readLastRoom();
    if (last?.roomId && (auth.username || last.name)) {
      autoRejoinedRef.current = true;
      const effectiveName = auth.username || last.name;
      const token = auth.getAccessToken();
      game.connect(effectiveName, last.roomId, token);
    } else {
      autoRejoinedRef.current = true;
      game.browseRooms();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, showAuth, game.phase]);

  const handleSignIn = async ({ email, password }) => auth.signIn(email, password);
  const handleSignUp = async ({ email, password, username }) => auth.signUp(email, password, username);
  const handleResendConfirmation = async (email) => auth.resendConfirmation(email);

  const handleLogout = async () => {
    game.disconnect();
    setGuestMode(false);
    await auth.signOut();
  };

  const handleConnect = (name, room) => {
    const effectiveName = auth.username || name;
    const token = auth.getAccessToken();
    game.connect(effectiveName, room, token);
  };

  // Espera o profile carregar antes de mostrar o lobby — assim o username vem
  // pronto e a tela não pisca como "visitante".
  if (auth.loading || (auth.isAuthed && auth.profileLoading)) {
    return (
      <div style={{
        height: '100%', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--green-dark)',
        color: 'var(--text-muted)',
      }}>
        Carregando...
      </div>
    );
  }

  if (showAuth) {
    return (
      <Auth
        hasSupabase={auth.hasSupabase}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        onResendConfirmation={handleResendConfirmation}
        onGuest={() => setGuestMode(true)}
      />
    );
  }

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      {(game.phase === 'connect' || game.phase === 'lobby') && (
        <Lobby
          phase={game.phase}
          connected={game.connected}
          isHost={game.isHost}
          lobbyPlayers={game.lobbyPlayers}
          availableRooms={game.availableRooms}
          roomId={game.roomId}
          myName={game.myName}
          authedUsername={auth.username}
          isGuest={guestMode && !auth.isAuthed}
          profile={auth.profile}
          onConnect={handleConnect}
          onStart={game.startGame}
          onLogout={handleLogout}
        />
      )}

      {game.phase === 'game' && (
        <Game
          board={game.board}
          boardEnds={game.boardEnds}
          currentTurn={game.currentTurn}
          players={game.players}
          hand={game.hand}
          selectedPiece={game.selectedPiece}
          roundEnd={game.roundEnd}
          isHost={game.isHost}
          myName={game.myName}
          roomId={game.roomId}
          onSelectPiece={game.selectPiece}
          onPlayPiece={game.playPiece}
          onPass={game.passTurn}
          onCancelSelection={game.cancelSelection}
          onPlayAgain={game.playAgain}
          onDisconnect={game.disconnect}
        />
      )}

      <Notification
        notifications={game.notifications}
        onDismiss={game.dismissNotif}
      />
    </div>
  );
}
