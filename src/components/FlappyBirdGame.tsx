"use client";

import React, { useEffect, useRef } from 'react';
import { useFlappyBird, PIPE_WIDTH, PIPE_GAP, BIRD_SIZE } from '../hooks/useFlappyBird';
import Link from 'next/link';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

const FlappyBirdGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    birdY,
    birdRotation,
    pipes,
    score,
    highScore,
    isGameActive,
    isGameOver,
    startGame,
    jump
  } = useFlappyBird(CANVAS_WIDTH, CANVAS_HEIGHT);

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (isGameActive) {
          jump();
        } else if (!isGameOver) {
          startGame();
        } else if (isGameOver) {
          startGame(); // Restart on space if game over
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameActive, isGameOver, jump, startGame]);

  // Render Game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw Grid (Retro Effect)
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1;
    for(let i=0; i<CANVAS_WIDTH; i+=40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for(let i=0; i<CANVAS_HEIGHT; i+=40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_WIDTH, i);
      ctx.stroke();
    }

    // Draw Pipes
    pipes.forEach(pipe => {
      // Create Gradient for pipes
      const pipeGradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
      pipeGradient.addColorStop(0, '#006600');
      pipeGradient.addColorStop(0.5, '#00FF00');
      pipeGradient.addColorStop(1, '#006600');

      ctx.fillStyle = pipeGradient;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00FF00';
      
      // Top Pipe
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
      
      // Bottom Pipe
      const bottomPipeY = pipe.topHeight + PIPE_GAP;
      ctx.fillRect(pipe.x, bottomPipeY, PIPE_WIDTH, CANVAS_HEIGHT - bottomPipeY);
      
      // Pipe Caps
      ctx.fillStyle = '#AAFF00';
      ctx.shadowBlur = 0;
      ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, PIPE_WIDTH + 10, 20);
      ctx.fillRect(pipe.x - 5, bottomPipeY, PIPE_WIDTH + 10, 20);
    });

    // Draw Bird with Rotation
    ctx.save();
    ctx.translate(50 + BIRD_SIZE / 2, birdY + BIRD_SIZE / 2);
    ctx.rotate(birdRotation);
    
    // Bird Body
    ctx.fillStyle = '#FFFF00';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#FFFF00';
    ctx.fillRect(-BIRD_SIZE / 2, -BIRD_SIZE / 2, BIRD_SIZE, BIRD_SIZE);
    
    // Bird Eye
    ctx.fillStyle = '#000';
    ctx.shadowBlur = 0;
    ctx.fillRect(BIRD_SIZE / 2 - 8, -BIRD_SIZE / 2 + 4, 4, 4);
    
    // Bird Wing
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-BIRD_SIZE / 2 + 2, 0, 8, 4);
    
    ctx.restore();

    // Draw Floor
    ctx.fillStyle = '#1a1a1a';
    ctx.shadowBlur = 0;
    ctx.fillRect(0, CANVAS_HEIGHT - 10, CANVAS_WIDTH, 10);
    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, CANVAS_HEIGHT - 10, CANVAS_WIDTH, 10);

  }, [birdY, birdRotation, pipes]);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-zinc-900 p-4">
      
      {/* UI Overlay */}
      <div className="absolute top-8 flex justify-between w-full max-w-[800px] px-8 z-10 pointer-events-none">
        <div className="flex flex-col">
          <span className="text-yellow-400 font-press-start text-xs mb-1">SCORE</span>
          <span className="text-4xl font-black text-white font-mono">{score.toString().padStart(6, '0')}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-cyan-400 font-press-start text-xs mb-1">HIGH SCORE</span>
          <span className="text-4xl font-black text-white font-mono">{highScore.toString().padStart(6, '0')}</span>
        </div>
      </div>

      {/* Game Canvas */}
      <div className="relative rounded-lg overflow-hidden border-4 border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="bg-black block"
        />

        {/* Start Screen */}
        {!isGameActive && !isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-20">
            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-orange-500 drop-shadow-[0_0_20px_rgba(234,179,8,0.5)] mb-8 transform -rotate-3">
              FLAPPY BIRD
            </h1>
            <div className="flex flex-col items-center gap-4 animate-pulse">
              <p className="text-white font-press-start text-sm">PRESS SPACE TO JUMP</p>
              <button 
                onClick={startGame}
                className="mt-8 px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded shadow-[0_0_20px_rgba(234,179,8,0.5)] transition-all hover:scale-105 active:scale-95 font-press-start text-sm"
              >
                START GAME
              </button>
            </div>
            <Link href="/" className="mt-8 text-zinc-500 hover:text-yellow-400 text-xs font-press-start hover:underline">
              EXIT TO MENU
            </Link>
          </div>
        )}

        {/* Game Over Screen */}
        {isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md z-20">
            <h2 className="text-5xl font-black text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)] mb-4 font-press-start">
              GAME OVER
            </h2>
            <div className="flex flex-col items-center gap-2 mb-8">
              <span className="text-zinc-400 font-mono text-xl">FINAL SCORE</span>
              <span className="text-4xl text-white font-mono font-bold">{score}</span>
            </div>
            <button 
              onClick={startGame}
              className="px-8 py-4 bg-white hover:bg-zinc-200 text-black font-bold rounded shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all hover:scale-105 active:scale-95 font-press-start text-sm"
            >
              TRY AGAIN
            </button>
            <Link href="/" className="mt-8 text-zinc-500 hover:text-white text-xs font-press-start hover:underline">
              EXIT TO MENU
            </Link>
          </div>
        )}
      </div>

      <div className="mt-6 text-zinc-500 text-xs font-press-start text-center">
        [SPACE] or [UP ARROW] to Jump
      </div>
    </div>
  );
};

export default FlappyBirdGame;
