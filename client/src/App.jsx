import React from 'react';
import useGame from './hooks/useGame.js';
import Lobby from './components/Lobby.jsx';
import Game from './components/Game.jsx';
import Notification from './components/Notification.jsx';

export default function App() {
  const game = useGame();

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      {(game.phase === 'connect' || game.phase === 'lobby') && (
        <Lobby
          phase={game.phase}
          connected={game.connected}
          isHost={game.isHost}
          lobbyPlayers={game.lobbyPlayers}
          roomId={game.roomId}
          myName={game.myName}
          onConnect={game.connect}
          onStart={game.startGame}
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
