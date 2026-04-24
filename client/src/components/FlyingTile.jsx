import { useEffect, useRef, useState } from 'react';
import Tile from './Tile.jsx';

// Face-down tile back (used for opponent animation)
function TileBack({ width, height }) {
  return (
    <div style={{
      width, height,
      borderRadius:  '4px',
      border:        '1.5px solid rgba(255,255,255,0.18)',
      background:    'linear-gradient(160deg, #1d6a2f 0%, #0b3015 100%)',
      boxShadow:     '0 2px 6px rgba(0,0,0,0.5)',
      display:       'flex',
      flexDirection: 'column',
      overflow:      'hidden',
    }}>
      <div style={{ flex: 1 }} />
      <div style={{ height: '1.5px', margin: '0 15%', background: 'rgba(255,255,255,0.22)' }} />
      <div style={{ flex: 1 }} />
    </div>
  );
}

// Animates a tile (face-up or face-down) from fromRect to the center of toRect.
export default function FlyingTile({ piece, fromRect, toRect, faceDown = false, onDone }) {
  const [phase, setPhase] = useState('initial');
  const rafRef = useRef(null);

  const srcW = fromRect.width;
  const srcH = fromRect.height;
  // Center the flying tile over the exact board piece position
  const dstLeft = toRect.left + toRect.width  / 2 - srcW / 2;
  const dstTop  = toRect.top  + toRect.height / 2 - srcH / 2;

  useEffect(() => {
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => setPhase('flying'));
    });
    const done = setTimeout(() => { setPhase('done'); onDone(); }, 520);
    return () => { cancelAnimationFrame(rafRef.current); clearTimeout(done); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === 'done') return null;

  const flying = phase === 'flying';

  const style = {
    position:      'fixed',
    zIndex:        999,
    pointerEvents: 'none',
    left:          flying ? dstLeft      : fromRect.left,
    top:           flying ? dstTop       : fromRect.top,
    width:         srcW,
    height:        srcH,
    transform:     flying ? 'scale(0.45)' : 'scale(1)',
    opacity:       flying ? 0             : 1,
    transition:    flying
      ? 'left 0.42s cubic-bezier(0.4,0,0.2,1), top 0.42s cubic-bezier(0.4,0,0.2,1), transform 0.42s ease-in, opacity 0.25s 0.25s'
      : 'none',
  };

  return (
    <div style={style}>
      {faceDown
        ? <TileBack width={srcW} height={srcH} />
        : <Tile piece={piece} vertical size={srcH / 64} />
      }
    </div>
  );
}
