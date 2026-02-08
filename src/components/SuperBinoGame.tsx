"use client";

import React, { useEffect, useRef } from 'react';
import { useSuperBino } from '../hooks/useSuperBino';

const SuperBinoGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const {
    gameState,
    score,
    cameraXRef,
    stage,
    playerRef,
    entitiesRef,
    particlesRef,
    projectilesRef,
    initGame,
    update,
    handleKeyDown,
    handleKeyUp,
    resetInputs,
    controls
  } = useSuperBino();

  // --- Rendering ---
  const draw = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = ctxRef.current ?? canvas.getContext('2d');
    if (!ctx) return;
    ctxRef.current = ctx;

    // Clear Screen
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background (Parallax-ish) - Based on Stage
    const themes = [
      ['#0f172a', '#1e293b'], // Stage 1: Slate (Night)
      ['#1e1b4b', '#312e81'], // Stage 2: Indigo (Deep Space)
      ['#270a0a', '#450a0a'], // Stage 3: Red (Volcano)
      ['#2e1065', '#581c87'], // Stage 4: Purple (Dungeon)
      ['#0891b2', '#2563eb'], // Stage 5: Cyan/Blue (Sky)
    ];
    const theme = themes[stage] || themes[0];

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, theme[0]);
    gradient.addColorStop(1, theme[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-cameraXRef.current, 0);

    // Draw Entities
    entitiesRef.current.forEach(ent => {
      if (ent.type === 'ground' || ent.type === 'block') {
        ctx.fillStyle = '#334155'; // Slate 700
        ctx.strokeStyle = '#64748b'; // Slate 500
        ctx.lineWidth = 2;
        ctx.fillRect(ent.x, ent.y, ent.width, ent.height);
        ctx.strokeRect(ent.x, ent.y, ent.width, ent.height);
        
        // Detail
        ctx.fillStyle = '#475569';
        ctx.fillRect(ent.x + 4, ent.y + 4, ent.width - 8, ent.height - 8);
      } else if (ent.type === 'coin') {
        ctx.fillStyle = '#fbbf24'; // Amber 400
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(ent.x + ent.width/2, ent.y + ent.height/2, ent.width/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Shine
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(ent.x + ent.width/2 - 3, ent.y + ent.height/2 - 3, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (ent.type === 'enemy') {
        ctx.fillStyle = '#ef4444'; // Red 500
        ctx.fillRect(ent.x, ent.y, ent.width, ent.height);
        
        // Eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(ent.x + 4, ent.y + 6, 8, 8);
        ctx.fillRect(ent.x + 20, ent.y + 6, 8, 8);
        ctx.fillStyle = '#000';
        ctx.fillRect(ent.x + 6 + (ent.vx > 0 ? 2 : 0), ent.y + 8, 4, 4);
        ctx.fillRect(ent.x + 22 + (ent.vx > 0 ? 2 : 0), ent.y + 8, 4, 4);
      } else if (ent.type === 'goal') {
        ctx.fillStyle = '#22c55e'; // Green 500
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 20;
        ctx.fillRect(ent.x, ent.y, ent.width, ent.height);
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#fff';
        ctx.font = '20px monospace';
        ctx.fillText('GOAL', ent.x, ent.y - 10);
      }
    });

    // Draw Projectiles
    projectilesRef.current.forEach(proj => {
      ctx.fillStyle = proj.color;
      ctx.shadowColor = proj.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.width / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Draw Player
    const p = playerRef.current;
    ctx.fillStyle = '#3b82f6'; // Blue 500
    ctx.shadowColor = '#3b82f6';
    ctx.shadowBlur = 15;
    ctx.fillRect(p.x, p.y, p.width, p.height);
    ctx.shadowBlur = 0;
    
    // Player Face
    ctx.fillStyle = '#fff';
    const faceDir = p.facing || 1;
    ctx.fillRect(p.x + (faceDir === 1 ? 18 : 4), p.y + 6, 8, 8); // Eye
    
    // Draw Particles
    particlesRef.current.forEach(part => {
      ctx.globalAlpha = part.life;
      ctx.fillStyle = part.color;
      ctx.fillRect(part.x, part.y, 4, 4);
      ctx.globalAlpha = 1;
    });

    ctx.restore();
    
    // HUD
    ctx.font = '20px "Press Start 2P", monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(`SCORE: ${score}`, 20, 40);
    ctx.fillText(`STAGE: ${stage + 1}`, 20, 70);
  }, [cameraXRef, score, stage, entitiesRef, particlesRef, projectilesRef, playerRef]);

  // --- Game Loop ---
  useEffect(() => {
    let rafId = 0;
    
    const loop = () => {
      update();
      draw();
      rafId = requestAnimationFrame(loop);
    };
    
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [update, draw]); // Dependencies for loop

  // --- Input Listeners ---
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  useEffect(() => {
    const onBlur = () => resetInputs();
    const onVisibility = () => {
      if (document.hidden) resetInputs();
    };
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [resetInputs]);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 overflow-hidden relative font-sans">
      
      {/* Header */}
      <div className="absolute top-4 left-4 z-10">
        <h1 className="text-2xl font-black italic tracking-tighter text-white drop-shadow-lg">
          SUPER <span className="text-blue-500">BINO</span> GO
        </h1>
      </div>

      {/* Game Container */}
      <div className="relative group rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="block max-w-full h-auto touch-none"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Overlays */}
        {gameState === 'start' && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white backdrop-blur-sm">
            <h2 className="text-4xl font-bold mb-4">READY?</h2>
            <p className="mb-8 text-zinc-400">Arrow Keys to Move • Space to Jump • F to Fire</p>
            <button 
              onClick={() => initGame(0)}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition-all transform hover:scale-105"
            >
              START GAME
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-red-900/80 flex flex-col items-center justify-center text-white backdrop-blur-sm">
            <h2 className="text-4xl font-bold mb-2">GAME OVER</h2>
            <p className="mb-8 text-xl">Score: {score}</p>
            <button 
              onClick={() => initGame(stage)}
              className="px-8 py-3 bg-white text-red-900 hover:bg-gray-200 rounded-lg font-bold transition-all transform hover:scale-105"
            >
              TRY AGAIN
            </button>
          </div>
        )}

        {gameState === 'won' && (
          <div className="absolute inset-0 bg-green-900/80 flex flex-col items-center justify-center text-white backdrop-blur-sm">
            <h2 className="text-4xl font-bold mb-2">YOU WIN!</h2>
            <p className="mb-2 text-xl">All Levels Cleared</p>
            <p className="mb-8 text-xl">Final Score: {score}</p>
            <button 
              onClick={() => initGame(0)}
              className="px-8 py-3 bg-white text-green-900 hover:bg-gray-200 rounded-lg font-bold transition-all transform hover:scale-105"
            >
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="mt-6 w-full max-w-[800px] flex justify-between md:hidden gap-4">
        <div className="flex gap-2">
          <button 
            className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-white text-2xl active:bg-white/30 backdrop-blur-sm border border-white/10"
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              controls.moveLeft(true);
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              controls.moveLeft(false);
              if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                e.currentTarget.releasePointerCapture(e.pointerId);
              }
            }}
            onPointerCancel={(e) => {
              e.preventDefault();
              controls.moveLeft(false);
            }}
            onLostPointerCapture={() => controls.moveLeft(false)}
          >←</button>
          <button 
            className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-white text-2xl active:bg-white/30 backdrop-blur-sm border border-white/10"
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              controls.moveRight(true);
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              controls.moveRight(false);
              if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                e.currentTarget.releasePointerCapture(e.pointerId);
              }
            }}
            onPointerCancel={(e) => {
              e.preventDefault();
              controls.moveRight(false);
            }}
            onLostPointerCapture={() => controls.moveRight(false)}
          >→</button>
        </div>
        <div className="flex gap-4">
          <button 
            className="w-16 h-16 bg-red-500/80 rounded-full flex items-center justify-center text-white font-bold text-lg active:bg-red-400 shadow-lg backdrop-blur-sm border border-white/10"
            onPointerDown={(e) => {
              e.preventDefault();
              controls.fire();
            }}
          >
            FIRE
          </button>
          <button 
            className="w-16 h-16 bg-blue-600/80 rounded-full flex items-center justify-center text-white font-bold text-lg active:bg-blue-500 shadow-lg backdrop-blur-sm border border-white/10"
            onPointerDown={(e) => {
              e.preventDefault();
              controls.jump();
            }}
          >
            JUMP
          </button>
        </div>
      </div>

      <div className="mt-4 text-zinc-500 text-xs font-mono hidden md:block">
        ARROWS to Move • SPACE to Jump • F to Fire
      </div>
    </div>
  );
};

export default SuperBinoGame;
