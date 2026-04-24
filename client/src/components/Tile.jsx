import React from 'react';

// Pip positions in a 3×3 grid (indices 0-8, row by row)
// 0 1 2
// 3 4 5
// 6 7 8
const PIP_PATTERNS = {
  0: [],
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

function PipGrid({ value, size = 1 }) {
  const pips = PIP_PATTERNS[value] || [];
  const pipSize = Math.max(3, Math.round(5 * size));
  const gap = Math.max(2, Math.round(3 * size));

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gridTemplateRows: 'repeat(3, 1fr)',
    gap: `${gap}px`,
    width: '100%',
    height: '100%',
    padding: `${Math.round(4 * size)}px`,
  };

  const cells = Array.from({ length: 9 }, (_, idx) => (
    <div
      key={idx}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {pips.includes(idx) && (
        <div
          style={{
            width: `${pipSize}px`,
            height: `${pipSize}px`,
            borderRadius: '50%',
            background: '#222',
            boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
          }}
        />
      )}
    </div>
  ));

  return <div style={gridStyle}>{cells}</div>;
}

export default function Tile({
  piece,             // [a, b]
  selected = false,
  onClick,
  size = 1,          // scale factor
  vertical = false,  // orientation
  dimmed = false,
}) {
  const [a, b] = piece;

  const baseW = Math.round(36 * size);
  const baseH = Math.round(64 * size);
  const halfH = Math.round(32 * size);
  const dividerThick = Math.max(1, Math.round(1.5 * size));
  const borderRadius = Math.max(3, Math.round(5 * size));

  const width = vertical ? baseW : baseH;
  const height = vertical ? baseH : baseW;

  const halfW = Math.round(32 * size);

  const tileStyle = {
    display: 'inline-flex',
    flexDirection: vertical ? 'column' : 'row',
    alignItems: 'stretch',
    width: `${width}px`,
    height: `${height}px`,
    background: selected ? '#ffffd0' : 'var(--tile-bg)',
    border: `${Math.max(1, Math.round(1.5 * size))}px solid ${selected ? 'var(--gold)' : 'var(--tile-border)'}`,
    borderRadius: `${borderRadius}px`,
    boxShadow: selected
      ? `0 0 0 ${Math.round(3 * size)}px var(--gold), var(--shadow)`
      : 'var(--shadow)',
    cursor: onClick ? 'pointer' : 'default',
    opacity: dimmed ? 0.4 : 1,
    transition: 'transform 0.15s, box-shadow 0.15s, opacity 0.15s',
    userSelect: 'none',
    overflow: 'hidden',
    flexShrink: 0,
  };

  const halfStyle = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
    minHeight: 0,
  };

  const dividerStyle = vertical
    ? {
        height: `${dividerThick}px`,
        background: '#aaa',
        margin: '0 4px',
        flexShrink: 0,
      }
    : {
        width: `${dividerThick}px`,
        background: '#aaa',
        margin: '4px 0',
        flexShrink: 0,
      };

  return (
    <div
      style={tileStyle}
      onClick={onClick}
      onMouseEnter={onClick ? (e) => {
        if (!selected) e.currentTarget.style.transform = 'translateY(-3px)';
      } : undefined}
      onMouseLeave={onClick ? (e) => {
        e.currentTarget.style.transform = 'translateY(0)';
      } : undefined}
      title={`${a}|${b}`}
    >
      <div style={{ ...halfStyle, width: vertical ? '100%' : `${halfW}px`, height: vertical ? `${halfH}px` : '100%' }}>
        <div style={{ width: '100%', height: '100%' }}>
          <PipGrid value={a} size={size} />
        </div>
      </div>
      <div style={dividerStyle} />
      <div style={{ ...halfStyle, width: vertical ? '100%' : `${halfW}px`, height: vertical ? `${halfH}px` : '100%' }}>
        <div style={{ width: '100%', height: '100%' }}>
          <PipGrid value={b} size={size} />
        </div>
      </div>
    </div>
  );
}
