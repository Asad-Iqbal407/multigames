"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTetris, STAGE_WIDTH, STAGE_HEIGHT } from "../hooks/useTetris";
import { TETROMINOES } from "../utils/tetrominoes";
import { tetrisAudio } from "../utils/tetrisAudio";
import Link from "next/link";

const BLOCK_SIZE = 30;

const TetrisGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nextPieceCanvasRef = useRef<HTMLCanvasElement>(null);
  const {
    stage,
    player,
    nextPiece,
    score,
    rows,
    level,
    gameOver,
    isGameActive,
    isPaused,
    startGame,
    move,
    keyUp,
    setIsPaused
  } = useTetris();

  // Focus handling for keyboard inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling
      if ([32, 37, 38, 39, 40].includes(e.keyCode)) {
        e.preventDefault();
      }
      move(e);
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keyUp(e);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [move, keyUp]);

  // Main Game Loop / Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Background Grid
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    for (let x = 0; x <= STAGE_WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * BLOCK_SIZE, 0);
      ctx.lineTo(x * BLOCK_SIZE, STAGE_HEIGHT * BLOCK_SIZE);
      ctx.stroke();
    }
    for (let y = 0; y <= STAGE_HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * BLOCK_SIZE);
      ctx.lineTo(STAGE_WIDTH * BLOCK_SIZE, y * BLOCK_SIZE);
      ctx.stroke();
    }

    // Draw Stage
    stage.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell[0] !== 0) {
          drawBlock(ctx, x, y, cell[0] as string);
        }
      });
    });

    // Draw Ghost Piece (Optional - maybe later)
    
  }, [stage, player]);

  // Render Next Piece
  useEffect(() => {
    const canvas = nextPieceCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (nextPiece && isGameActive) {
       // Center the piece
       const offsetX = (canvas.width - nextPiece.shape[0].length * 20) / 2;
       const offsetY = (canvas.height - nextPiece.shape.length * 20) / 2;
       
       nextPiece.shape.forEach((row, y) => {
         row.forEach((cell, x) => {
           if (cell !== 0) {
             drawBlock(ctx, x, y, cell as string, 20, offsetX, offsetY);
           }
         });
       });
    }
  }, [nextPiece, isGameActive]);

  const drawBlock = (
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    type: string, 
    size = BLOCK_SIZE,
    offsetX = 0,
    offsetY = 0
  ) => {
    const tetromino = Object.values(TETROMINOES).find(t => 
      t.shape.some(row => row.includes(type))
    ) || TETROMINOES[type as keyof typeof TETROMINOES];
    
    const color = tetromino ? `rgb(${tetromino.color})` : '#555';
    
    // Glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
    ctx.fillStyle = color;
    ctx.fillRect(x * size + offsetX, y * size + offsetY, size, size);
    
    // Bevel/Inner Highlight
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(x * size + offsetX, y * size + offsetY, size, size / 2);
    
    // Border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.strokeRect(x * size + offsetX, y * size + offsetY, size, size);
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-8 min-h-screen p-8 bg-black font-orbitron text-white">
      {/* Game Container */}
      <div className="relative group">
         {/* Bezel */}
         <div className="relative border-8 border-zinc-800 rounded-xl bg-black shadow-[0_0_50px_rgba(100,0,255,0.2)] p-2">
            <canvas
              ref={canvasRef}
              width={STAGE_WIDTH * BLOCK_SIZE}
              height={STAGE_HEIGHT * BLOCK_SIZE}
              className="bg-black/90 border border-zinc-800 rounded-sm shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]"
            />
            
            {/* Overlay for Game Over / Start */}
            {!isGameActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10">
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-6 drop-shadow-[0_0_10px_rgba(200,0,255,0.5)]">
                  NEON TETRIS
                </h1>
                {gameOver && (
                  <div className="text-red-500 font-bold mb-4 text-xl animate-pulse">GAME OVER</div>
                )}
                <button
                  onClick={startGame}
                  className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded shadow-[0_0_20px_rgba(147,51,234,0.5)] transition-all hover:scale-105 active:scale-95 font-press-start text-xs"
                >
                  {gameOver ? 'TRY AGAIN' : 'START GAME'}
                </button>
                <Link href="/" className="mt-4 text-zinc-400 hover:text-white text-xs font-press-start hover:underline">
                  EXIT TO MENU
                </Link>
              </div>
            )}
            
            {isPaused && isGameActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
                <div className="text-3xl font-bold text-yellow-400 animate-pulse">PAUSED</div>
              </div>
            )}
         </div>
      </div>

      {/* HUD */}
      <div className="flex flex-col gap-6 w-64">
        {/* Next Piece */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          <h3 className="text-zinc-500 text-xs font-press-start mb-4 text-center">NEXT</h3>
          <div className="flex justify-center h-24 items-center bg-black/50 rounded-lg inner-shadow">
             <canvas ref={nextPieceCanvasRef} width={100} height={80} />
          </div>
        </div>

        {/* Stats */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.5)] space-y-6">
          <div>
            <h3 className="text-zinc-500 text-xs font-press-start mb-2">SCORE</h3>
            <div className="text-2xl text-purple-400 font-press-start drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]">
              {score.toString().padStart(6, '0')}
            </div>
          </div>
          
          <div>
            <h3 className="text-zinc-500 text-xs font-press-start mb-2">LEVEL</h3>
            <div className="text-2xl text-yellow-400 font-press-start drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]">
              {level}
            </div>
          </div>

          <div>
            <h3 className="text-zinc-500 text-xs font-press-start mb-2">LINES</h3>
            <div className="text-2xl text-green-400 font-press-start drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]">
              {rows}
            </div>
          </div>
        </div>

        {/* Controls Info */}
        <div className="text-zinc-600 text-[10px] font-press-start text-center space-y-2 mt-4">
           <p>ARROWS to Move/Rotate</p>
           <p>P to Pause</p>
           <button 
             onClick={() => tetrisAudio.setMute(false)} 
             className="mt-4 hover:text-white"
           >
             [ CLICK FOR SOUND ]
           </button>
        </div>
      </div>
    </div>
  );
};

export default TetrisGame;
