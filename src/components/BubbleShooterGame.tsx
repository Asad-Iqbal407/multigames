"use client";

import React, { useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { 
  useBubbleShooter, 
  WORLD_WIDTH, 
  WORLD_HEIGHT, 
  BUBBLE_RADIUS,
  SHOOTER_Y,
  BubbleColor
} from '../hooks/useBubbleShooter';

const COLOR_MAP: Record<BubbleColor, string> = {
  cyan: '#00f2ff',
  magenta: '#ff00ff',
  yellow: '#ffff00',
  lime: '#00ff00',
  orange: '#ff8800',
  purple: '#bc00ff'
};

const BubbleShooterGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isPointerDownRef = useRef(false);
  const aimAngleRef = useRef(-Math.PI / 2);
  const {
    grid,
    shooterColor,
    nextColor,
    projectile,
    gameState,
    score,
    level,
    angle,
    setAngle,
    shoot,
    initGrid,
    advanceLevel,
    bubblesRemaining,
    particlesRef
  } = useBubbleShooter();

  const stateRef = useRef<{
    grid: typeof grid;
    shooterColor: BubbleColor;
    nextColor: BubbleColor;
    projectile: typeof projectile;
    gameState: typeof gameState;
    score: number;
    level: number;
    angle: number;
    bubblesRemaining: number;
  } | null>(null);

  const drawBubble = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, color: BubbleColor, radius: number = BUBBLE_RADIUS) => {
    const hex = COLOR_MAP[color];
    
    // Outer glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = hex;
    
    // Bubble gradient
    const gradient = ctx.createRadialGradient(x - radius/3, y - radius/3, radius/10, x, y, radius);
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(0.2, hex);
    gradient.addColorStop(1, 'rgba(0,0,0,0.5)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius - 1, 0, Math.PI * 2);
    ctx.fill();
    
    // Highlight
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(x - radius/3, y - radius/3, radius/4, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  useEffect(() => {
    stateRef.current = {
      grid,
      shooterColor,
      nextColor,
      projectile,
      gameState,
      score,
      level,
      angle,
      bubblesRemaining,
    };
    aimAngleRef.current = angle;
  }, [grid, shooterColor, nextColor, projectile, gameState, score, level, angle, bubblesRemaining]);

  const clampAimAngle = useCallback((a: number) => Math.max(-Math.PI + 0.18, Math.min(-0.18, a)), []);

  const getAimAngleFromEvent = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (WORLD_WIDTH / rect.width);
    const y = (e.clientY - rect.top) * (WORLD_HEIGHT / rect.height);
    const dx = x - WORLD_WIDTH / 2;
    const dy = y - SHOOTER_Y;
    return clampAimAngle(Math.atan2(dy, dx));
  }, [clampAimAngle]);

  const simulateAimPath = useCallback((a: number, g: typeof grid) => {
    const points: { x: number; y: number }[] = [];
    const sx = WORLD_WIDTH / 2;
    const sy = SHOOTER_Y;
    points.push({ x: sx, y: sy });

    let x = sx;
    let y = sy;
    let vx = Math.cos(a) * 8;
    const vy = Math.sin(a) * 8;

    for (let i = 0; i < 400; i++) {
      x += vx;
      y += vy;

      if (x < BUBBLE_RADIUS || x > WORLD_WIDTH - BUBBLE_RADIUS) {
        vx = -vx;
        x = x < BUBBLE_RADIUS ? BUBBLE_RADIUS : WORLD_WIDTH - BUBBLE_RADIUS;
      }

      if (y < BUBBLE_RADIUS) {
        points.push({ x, y });
        break;
      }

      let hit = false;
      for (let r = 0; r < g.length && !hit; r++) {
        for (let c = 0; c < g[r].length; c++) {
          const b = g[r][c];
          if (!b) continue;
          if (Math.hypot(x - b.x, y - b.y) < BUBBLE_RADIUS * 2 - 2) {
            hit = true;
            break;
          }
        }
      }
      if (hit) {
        points.push({ x, y });
        break;
      }

      if (i % 6 === 0) points.push({ x, y });
    }

    return points;
  }, []);

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const s = stateRef.current;
    if (!canvas || !s) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    const glow = ctx.createRadialGradient(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 40, WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_HEIGHT);
    glow.addColorStop(0, 'rgba(0,242,255,0.08)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= WORLD_WIDTH; x += 36) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, WORLD_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= WORLD_HEIGHT; y += 36) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WORLD_WIDTH, y);
      ctx.stroke();
    }

    for (let r = 0; r < s.grid.length; r++) {
      for (let c = 0; c < s.grid[r].length; c++) {
        const bubble = s.grid[r][c];
        if (bubble) drawBubble(ctx, bubble.x, bubble.y, bubble.color);
      }
    }

    if (s.projectile) {
      drawBubble(ctx, s.projectile.x, s.projectile.y, s.projectile.color);
    }

    const ps = particlesRef.current;
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      ctx.fillStyle = (COLOR_MAP as Record<string, string>)[p.color] || p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2 + (1 - p.life) * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (s.gameState === 'playing') {
      const sx = WORLD_WIDTH / 2;
      const sy = SHOOTER_Y;
      const a = clampAimAngle(s.angle);

      if (!s.projectile) {
        const path = simulateAimPath(a, s.grid);
        ctx.setLineDash([6, 8]);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
        ctx.stroke();
        ctx.setLineDash([]);

        const last = path[path.length - 1];
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = 'rgba(0,242,255,0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(last.x, last.y, 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      drawBubble(ctx, sx, sy, s.shooterColor);

      ctx.save();
      ctx.globalAlpha = 0.65;
      drawBubble(ctx, sx + 62, sy + 10, s.nextColor, BUBBLE_RADIUS * 0.7);
      ctx.restore();

      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(0, SHOOTER_Y + BUBBLE_RADIUS + 18, WORLD_WIDTH, 1);
    }
  }, [clampAimAngle, drawBubble, particlesRef, simulateAimPath]);

  useEffect(() => {
    let rafId = 0;
    const loop = () => {
      drawFrame();
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [drawFrame]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    isPointerDownRef.current = true;

    const a = getAimAngleFromEvent(e);
    if (a !== null) {
      aimAngleRef.current = a;
      setAngle(a);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPointerDownRef.current) {
      const a = getAimAngleFromEvent(e);
      if (a !== null) {
        aimAngleRef.current = a;
        setAngle(a);
      }
      return;
    }
    const a = getAimAngleFromEvent(e);
    if (a !== null) {
      aimAngleRef.current = a;
      setAngle(a);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isPointerDownRef.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    const s = stateRef.current;
    if (!s) return;
    if (s.gameState === 'playing') shoot(aimAngleRef.current);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-orbitron flex flex-col items-center justify-center p-4 overflow-hidden relative">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(0,242,255,0.05),transparent_70%)] pointer-events-none" />
      
      {/* Game Header */}
      <div className="z-10 w-full max-w-[420px] flex justify-between items-end mb-6 px-4">
        <div className="space-y-1">
          <Link href="/" className="text-[10px] text-cyan-400 hover:text-white transition-colors font-press-start mb-2 block">
            &lt; BACK_TO_ARCADE
          </Link>
          <h1 className="text-2xl font-black tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            BUBBLE<span className="text-cyan-400">SHOOTER</span>
          </h1>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-zinc-500 font-press-start uppercase mb-1">Score</div>
          <div className="text-xl font-bold text-white tabular-nums">{score.toString().padStart(6, '0')}</div>
        </div>
      </div>

      {/* Main Game Container */}
      <div className="relative z-10 group">
        <div className="absolute -inset-1 bg-gradient-to-b from-cyan-500/20 to-purple-500/20 rounded-[2rem] blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
        
        <div className="relative bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_55%,rgba(0,0,0,0.75)_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.05),rgba(0,255,0,0.02),rgba(0,0,255,0.05))] bg-[length:100%_4px,4px_100%]" />
          </div>
          <canvas
            ref={canvasRef}
            width={WORLD_WIDTH}
            height={WORLD_HEIGHT}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="cursor-crosshair max-w-full h-auto touch-none relative z-10"
            style={{ aspectRatio: `${WORLD_WIDTH}/${WORLD_HEIGHT}` }}
          />

          {/* Game Over Overlay */}
          {gameState === 'gameover' && (
            <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6 border border-red-500/50">
                <span className="text-4xl">💀</span>
              </div>
              <h2 className="text-4xl font-black text-white mb-2 tracking-tighter">GAME OVER</h2>
              <p className="text-zinc-400 font-mono text-sm mb-8 uppercase tracking-widest">
                {bubblesRemaining <= 0 ? 'OUT OF AMMO' : 'SECTOR OVERRUN'}
              </p>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 w-full mb-8">
                <div className="text-[10px] text-zinc-500 font-press-start mb-2">Final Score</div>
                <div className="text-3xl font-bold text-cyan-400 tabular-nums">{score}</div>
              </div>

              <button
                onClick={initGrid}
                className="w-full py-4 bg-cyan-500 hover:bg-white text-black font-press-start text-xs rounded-xl transition-all active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
              >
                REINITIALIZE
              </button>
            </div>
          )}

          {/* Start Overlay */}
          {gameState === 'idle' && (
            <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center">
              <h2 className="text-3xl font-black text-white mb-6 tracking-tighter">READY TO SHOOT?</h2>
              <button
                onClick={initGrid}
                className="px-12 py-4 bg-white text-black font-press-start text-xs rounded-xl hover:bg-cyan-400 transition-all active:scale-95"
              >
                START_SESSION
              </button>
            </div>
          )}

          {gameState === 'levelclear' && (
            <div className="absolute inset-0 z-20 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
              <div className="w-20 h-20 rounded-full bg-cyan-500/15 flex items-center justify-center mb-6 border border-cyan-500/40">
                <span className="text-4xl">✨</span>
              </div>
              <h2 className="text-4xl font-black text-white mb-2 tracking-tighter">LEVEL CLEARED</h2>
              <p className="text-zinc-400 font-mono text-sm mb-8 uppercase tracking-widest">Preparing Next Wave</p>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 w-full mb-8">
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <div className="text-[10px] text-zinc-500 font-press-start mb-1">Score</div>
                    <div className="text-2xl font-bold text-white tabular-nums">{score.toString().padStart(6, '0')}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-zinc-500 font-press-start mb-1">Next</div>
                    <div className="text-2xl font-bold text-cyan-400 tabular-nums">LVL {level + 1}</div>
                  </div>
                </div>
              </div>

              <button
                onClick={advanceLevel}
                className="w-full py-4 bg-white hover:bg-cyan-400 text-black font-press-start text-xs rounded-xl transition-all active:scale-95"
              >
                NEXT_LEVEL
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Controls Hint */}
      <div className="mt-8 w-full max-w-[420px] flex items-center justify-between gap-6 px-4 text-[10px] text-zinc-500 font-mono tracking-widest uppercase opacity-70">
        <div className="flex items-center gap-3">
          <span>[ DRAG ] AIM</span>
          <span className="text-zinc-700">|</span>
          <span>[ RELEASE ] SHOOT</span>
        </div>
        <div className="text-right">
          <span className="text-zinc-700">AMMO</span> <span className="text-white">{Math.max(0, bubblesRemaining)}</span>
        </div>
      </div>

      {/* Decorative Scanlines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-50" />
    </div>
  );
};

export default BubbleShooterGame; 
