import React, { useRef, useEffect, useCallback } from 'react';

// Canvas board — each piece is 36×64px laid horizontally in a chain

const PIECE_W = 64;  // horizontal piece: wider dimension
const PIECE_H = 36;
const PAD = 8;        // padding inside canvas edges
const DIVIDER = 2;    // divider line width inside piece
const BORDER_R = 5;
const PIP_R = 4;      // pip circle radius
const GOLD = '#f5c518';
const TILE_BG = '#fffff0';
const BORDER_COLOR = '#bbb';
const PIP_COLOR = '#222';

// Pip positions in a 3×3 grid (relative 0-1)
const PIP_GRID = [
  [0, 0], [0.5, 0], [1, 0],
  [0, 0.5],          [0.5, 0.5], [1, 0.5],
  [0, 1], [0.5, 1],  [1, 1],
];

const PIP_PATTERNS = {
  0: [],
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

function drawPips(ctx, cx, cy, halfW, halfH, value) {
  const pips = PIP_PATTERNS[value] || [];
  const innerPad = 5;
  const availW = halfW - innerPad * 2;
  const availH = halfH - innerPad * 2;

  for (const idx of pips) {
    const [gx, gy] = PIP_GRID[idx];
    const px = cx - halfW / 2 + innerPad + gx * availW;
    const py = cy - halfH / 2 + innerPad + gy * availH;
    ctx.beginPath();
    ctx.arc(px, py, PIP_R, 0, Math.PI * 2);
    ctx.fillStyle = PIP_COLOR;
    ctx.fill();
  }
}

function drawPiece(ctx, x, y, piece, flipped, highlight = false) {
  const [a, b] = flipped ? [piece[1], piece[0]] : piece;
  const w = PIECE_W;
  const h = PIECE_H;

  // Shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;

  // Background
  ctx.fillStyle = highlight ? '#ffffd0' : TILE_BG;
  ctx.strokeStyle = highlight ? GOLD : BORDER_COLOR;
  ctx.lineWidth = highlight ? 2.5 : 1.5;

  // Rounded rect
  ctx.beginPath();
  ctx.moveTo(x + BORDER_R, y);
  ctx.lineTo(x + w - BORDER_R, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + BORDER_R);
  ctx.lineTo(x + w, y + h - BORDER_R);
  ctx.quadraticCurveTo(x + w, y + h, x + w - BORDER_R, y + h);
  ctx.lineTo(x + BORDER_R, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - BORDER_R);
  ctx.lineTo(x, y + BORDER_R);
  ctx.quadraticCurveTo(x, y, x + BORDER_R, y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.stroke();

  // Divider
  const midX = x + w / 2;
  ctx.beginPath();
  ctx.moveTo(midX, y + 4);
  ctx.lineTo(midX, y + h - 4);
  ctx.strokeStyle = BORDER_COLOR;
  ctx.lineWidth = DIVIDER;
  ctx.stroke();

  // Pips left half
  const halfW = w / 2;
  const halfH = h;
  drawPips(ctx, x + halfW / 2, y + halfH / 2, halfW, halfH, a);
  // Pips right half
  drawPips(ctx, x + halfW + halfW / 2, y + halfH / 2, halfW, halfH, b);
}

function drawEndIndicator(ctx, x, y, value, side) {
  const r = 14;
  const label = `${value}`;

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(245,197,24,0.18)';
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = GOLD;
  ctx.font = 'bold 13px Segoe UI, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x, y);

  // Arrow label
  ctx.font = '10px Segoe UI, sans-serif';
  ctx.fillStyle = 'rgba(245,197,24,0.7)';
  ctx.fillText(side === 'left' ? '<' : '>', x, y + r + 9);
}

export default function Board({ board, boardEnds }) {
  const canvasRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const totalPieces = board.length;
    const contentW = totalPieces > 0
      ? totalPieces * PIECE_W + (totalPieces - 1) * 2 + 80
      : 300;
    const contentH = PIECE_H + PAD * 2 + 40;

    canvas.width = Math.max(contentW, canvas.parentElement?.clientWidth || 600);
    canvas.height = contentH;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (board.length === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.font = '14px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('O tabuleiro está vazio — jogue a primeira peça!', canvas.width / 2, canvas.height / 2);
      return;
    }

    const startX = boardEnds
      ? PAD + 36
      : (canvas.width - board.length * (PIECE_W + 2)) / 2;
    const y = PAD + 20;

    board.forEach((entry, i) => {
      const x = startX + i * (PIECE_W + 2);
      drawPiece(ctx, x, y, entry.piece, entry.flipped);
    });

    // Draw end indicators
    if (boardEnds) {
      const leftX = startX - 36;
      const rightX = startX + board.length * (PIECE_W + 2) + 10;
      const midY = y + PIECE_H / 2;

      drawEndIndicator(ctx, leftX, midY, boardEnds.left, 'left');
      drawEndIndicator(ctx, rightX, midY, boardEnds.right, 'right');
    }
  }, [board, boardEnds]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Redraw on resize
  useEffect(() => {
    const observer = new ResizeObserver(() => draw());
    const parent = canvasRef.current?.parentElement;
    if (parent) observer.observe(parent);
    return () => observer.disconnect();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        maxWidth: '100%',
      }}
    />
  );
}
