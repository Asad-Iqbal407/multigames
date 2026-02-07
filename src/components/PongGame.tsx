"use client";

import React, { useEffect, useRef } from 'react';
import { usePong, PADDLE_WIDTH, PADDLE_HEIGHT, BALL_SIZE } from '../hooks/usePong';
import Link from 'next/link';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

const PongGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    gameState,
    isGameActive,
    isGameOver,
    startGame
  } = usePong(CANVAS_WIDTH, CANVAS_HEIGHT);

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
    
    // Draw Center Line
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Player Paddle (Neon Blue)
    ctx.fillStyle = '#00FFFF';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00FFFF';
    ctx.fillRect(0, gameState.playerY, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Draw AI Paddle (Neon Pink)
    ctx.fillStyle = '#FF00FF';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#FF00FF';
    ctx.fillRect(CANVAS_WIDTH - PADDLE_WIDTH, gameState.aiY, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Draw Ball (White Neon)
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#FFFFFF';
    ctx.fillRect(gameState.ballX, gameState.ballY, BALL_SIZE, BALL_SIZE);

    // Draw Scores
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 40px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(gameState.playerScore.toString(), CANVAS_WIDTH * 0.25, 60);
    ctx.fillText(gameState.aiScore.toString(), CANVAS_WIDTH * 0.75, 60);

  }, [gameState]);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-zinc-900 p-4 font-orbitron">
      
      {/* Title */}
      <div className="absolute top-10 text-center">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500 drop-shadow-[0_0_10px_rgba(255,0,255,0.3)] font-press-start">
          NEON PONG
        </h1>
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
            <div className="flex flex-col items-center gap-6 animate-pulse">
              <p className="text-white font-press-start text-xs tracking-widest mb-4">FIRST TO 10 WINS</p>
              <button 
                onClick={startGame}
                className="px-10 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all hover:scale-105 active:scale-95 font-press-start text-xs"
              >
                START MATCH
              </button>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-8 text-zinc-500 font-press-start text-[10px]">
              <div className="text-center">
                <p className="text-cyan-400 mb-2">PLAYER</p>
                <p>W / S</p>
                <p>OR ARROWS</p>
              </div>
              <div className="text-center">
                <p className="text-pink-400 mb-2">AI</p>
                <p>AUTOMATIC</p>
              </div>
            </div>
            <Link href="/" className="mt-10 text-zinc-500 hover:text-white text-[10px] font-press-start hover:underline">
              EXIT TO MENU
            </Link>
          </div>
        )}

        {/* Game Over Screen */}
        {isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md z-20">
            <h2 className={`text-5xl font-black mb-8 font-press-start ${gameState.playerScore >= 10 ? 'text-cyan-400 drop-shadow-[0_0_20px_rgba(0,255,255,0.5)]' : 'text-pink-500 drop-shadow-[0_0_20px_rgba(255,0,255,0.5)]'}`}>
              {gameState.playerScore >= 10 ? 'YOU WIN!' : 'AI WINS!'}
            </h2>
            <div className="flex gap-12 mb-12">
              <div className="flex flex-col items-center">
                <span className="text-zinc-500 text-xs mb-2 font-press-start">YOU</span>
                <span className="text-4xl text-white font-bold">{gameState.playerScore}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-zinc-500 text-xs mb-2 font-press-start">AI</span>
                <span className="text-4xl text-white font-bold">{gameState.aiScore}</span>
              </div>
            </div>
            <button 
              onClick={startGame}
              className="px-10 py-5 bg-white hover:bg-zinc-200 text-black font-bold rounded shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all hover:scale-105 active:scale-95 font-press-start text-xs"
            >
              REMATCH
            </button>
            <Link href="/" className="mt-10 text-zinc-500 hover:text-white text-[10px] font-press-start hover:underline">
              EXIT TO MENU
            </Link>
          </div>
        )}
      </div>

      <div className="mt-8 text-zinc-600 text-[10px] font-press-start tracking-tighter">
        CONTROL YOUR PADDLE WITH W/S OR UP/DOWN ARROWS
      </div>
    </div>
  );
};

export default PongGame;
