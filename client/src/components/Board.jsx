import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';

const RW = 64, RH = 32;   // regular piece: landscape
const DW = 32, DH = 64;   // double  piece: portrait (perpendicular)
const GAP   = 4;
const RAD   = 5;
const GOLD  = '#f5c518';
const ANIM_MS = 380;

const PIP_GRID = [
  [0, 0], [0.5, 0], [1, 0],
  [0, 0.5], [0.5, 0.5], [1, 0.5],
  [0, 1],   [0.5, 1],   [1, 1],
];
const PIP_PATTERNS = {
  0: [], 1: [4], 2: [0, 8], 3: [0, 4, 8],
  4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
};

const isDouble   = (p) => p[0] === p[1];
const pieceSize  = (p) => isDouble(p) ? [DW, DH] : [RW, RH];

// Easing: ease out cubic
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

function drawPips(ctx, ox, oy, w, h, n) {
  const pad = 5, aw = w - pad * 2, ah = h - pad * 2;
  const pr  = Math.min(w, h) * 0.13;
  ctx.fillStyle = '#222';
  for (const i of PIP_PATTERNS[n] ?? []) {
    const [gx, gy] = PIP_GRID[i];
    ctx.beginPath();
    ctx.arc(ox + pad + gx * aw, oy + pad + gy * ah, pr, 0, Math.PI * 2);
    ctx.fill();
  }
}

function roundRect(ctx, x, y, w, h) {
  ctx.beginPath();
  ctx.moveTo(x + RAD, y);
  ctx.lineTo(x + w - RAD, y);
  ctx.arcTo(x + w, y,     x + w, y + RAD,     RAD);
  ctx.lineTo(x + w, y + h - RAD);
  ctx.arcTo(x + w, y + h, x + w - RAD, y + h, RAD);
  ctx.lineTo(x + RAD, y + h);
  ctx.arcTo(x,     y + h, x,     y + h - RAD, RAD);
  ctx.lineTo(x,     y + RAD);
  ctx.arcTo(x,     y,     x + RAD, y,          RAD);
  ctx.closePath();
}

function drawTileBg(ctx, x, y, w, h) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur  = 5;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle   = '#fffff0';
  roundRect(ctx, x, y, w, h);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#bbb';
  ctx.lineWidth   = 1.5;
  roundRect(ctx, x, y, w, h);
  ctx.stroke();
}

function drawRegular(ctx, x, y, a, b) {
  drawTileBg(ctx, x, y, RW, RH);
  const mid = x + RW / 2;
  ctx.beginPath(); ctx.moveTo(mid, y + 4); ctx.lineTo(mid, y + RH - 4);
  ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1.5; ctx.stroke();
  drawPips(ctx, x,          y, RW / 2, RH, a);
  drawPips(ctx, x + RW / 2, y, RW / 2, RH, b);
}

function drawDouble(ctx, x, y, n) {
  drawTileBg(ctx, x, y, DW, DH);
  const mid = y + DH / 2;
  ctx.beginPath(); ctx.moveTo(x + 4, mid); ctx.lineTo(x + DW - 4, mid);
  ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1.5; ctx.stroke();
  drawPips(ctx, x, y,          DW, DH / 2, n);
  drawPips(ctx, x, y + DH / 2, DW, DH / 2, n);
}

function drawBadge(ctx, x, cy, value, side) {
  ctx.beginPath();
  ctx.arc(x, cy, 14, 0, Math.PI * 2);
  ctx.fillStyle   = 'rgba(245,197,24,0.18)';
  ctx.fill();
  ctx.strokeStyle = GOLD; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle   = GOLD;
  ctx.font        = 'bold 13px Segoe UI, sans-serif';
  ctx.textAlign   = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(String(value), x, cy);
  ctx.font        = '10px Segoe UI, sans-serif';
  ctx.fillStyle   = 'rgba(245,197,24,0.7)';
  ctx.fillText(side === 'left' ? '<' : '>', x, cy + 23);
}

function renderFrame(ctx, canvas, container, board, boardEnds, animIdx, animT) {
  const cW = container.clientWidth  || 600;
  const cH = container.clientHeight || 200;

  if (!board || board.length === 0) {
    canvas.width  = cW;
    canvas.height = cH;
    ctx.clearRect(0, 0, cW, cH);
    ctx.fillStyle    = 'rgba(255,255,255,0.15)';
    ctx.font         = '15px Segoe UI, sans-serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Jogue a primeira peça para começar!', cW / 2, cH / 2);
    return;
  }

  const totalW = board.reduce((s, { piece }) => s + pieceSize(piece)[0], 0)
    + Math.max(0, board.length - 1) * GAP;

  const BADGE  = 40;
  canvas.width  = Math.max(cW, totalW + BADGE * 2 + 20);
  canvas.height = Math.max(cH, DH + 40);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const startX = (canvas.width - totalW) / 2;
  const cy     = canvas.height / 2;

  let x = startX;
  board.forEach(({ piece, flipped }, i) => {
    const [w, h]  = pieceSize(piece);
    const py      = cy - h / 2;
    const isNew   = i === animIdx;
    const progress = isNew ? easeOut(Math.min(animT, 1)) : 1;

    ctx.save();
    if (isNew && progress < 1) {
      // Scale from 0.2 → 1, fade from 0 → 1
      ctx.globalAlpha = progress;
      const scale   = 0.2 + progress * 0.8;
      const pcx     = x + w / 2;
      const pcy     = cy;
      ctx.translate(pcx, pcy);
      ctx.scale(scale, scale);
      ctx.translate(-pcx, -pcy);
    }

    if (isDouble(piece)) {
      drawDouble(ctx, x, py, piece[0]);
    } else {
      const a = flipped ? piece[1] : piece[0];
      const b = flipped ? piece[0] : piece[1];
      drawRegular(ctx, x, py, a, b);
    }
    ctx.restore();

    x += w + GAP;
  });

  if (boardEnds) {
    drawBadge(ctx, startX - BADGE + 4, cy, boardEnds.left,  'left');
    drawBadge(ctx, x - GAP + BADGE - 4, cy, boardEnds.right, 'right');
  }
}

const Board = forwardRef(function Board({ board, boardEnds }, ref) {
  const canvasRef    = useRef(null);
  const containerRef = useRef(null);

  // Animation state (mutable, no re-render needed)
  const animRef   = useRef({ idx: -1, startMs: 0, raf: null });
  const prevBoard = useRef([]);

  // Expose a method to get the exact screen rect of a piece by index.
  useImperativeHandle(ref, () => ({
    getPieceScreenRect(idx) {
      const canvas    = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container || idx < 0 || idx >= board.length) return null;

      // Replicate the same layout math as renderFrame
      const BADGE  = 40;
      const cW     = container.clientWidth  || 600;
      const cH     = container.clientHeight || 200;
      const totalW = board.reduce((s, { piece }) => s + pieceSize(piece)[0], 0)
        + Math.max(0, board.length - 1) * GAP;
      const canvasW = Math.max(cW, totalW + BADGE * 2 + 20);
      const canvasH = Math.max(cH, DH + 40);

      const startX = (canvasW - totalW) / 2;
      const cy     = canvasH / 2;

      let x = startX;
      for (let j = 0; j < idx; j++) x += pieceSize(board[j].piece)[0] + GAP;

      const [w, h] = pieceSize(board[idx].piece);
      const y      = cy - h / 2;

      // Convert canvas coords → viewport coords
      const cr = canvas.getBoundingClientRect();
      return { left: cr.left + x, top: cr.top + y, width: w, height: h };
    },
  }), [board]);

  const doFrame = useCallback(() => {
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const { idx, startMs } = animRef.current;
    const elapsed  = idx >= 0 ? (performance.now() - startMs) : ANIM_MS;
    const t        = idx >= 0 ? elapsed / ANIM_MS : 1;

    renderFrame(
      canvas.getContext('2d'), canvas, container,
      board, boardEnds, idx, t,
    );

    if (t < 1) {
      animRef.current.raf = requestAnimationFrame(doFrame);
    } else {
      animRef.current.idx = -1;
    }
  }, [board, boardEnds]);

  useEffect(() => {
    const prev = prevBoard.current;

    if (board.length > prev.length) {
      // Detect which end the new piece was added to
      const addedLeft =
        prev.length > 0 &&
        (board[0].piece[0] !== prev[0].piece[0] || board[0].piece[1] !== prev[0].piece[1]);

      animRef.current = {
        idx:     addedLeft ? 0 : board.length - 1,
        startMs: performance.now(),
        raf:     null,
      };
    }

    prevBoard.current = board;

    cancelAnimationFrame(animRef.current.raf);
    animRef.current.raf = requestAnimationFrame(doFrame);

    return () => cancelAnimationFrame(animRef.current.raf);
  }, [board, boardEnds, doFrame]);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(animRef.current.raf);
      animRef.current.raf = requestAnimationFrame(doFrame);
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [doFrame]);

  return (
    <div
      ref={containerRef}
      style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', padding: '16px' }}
    >
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
});

export default Board;
