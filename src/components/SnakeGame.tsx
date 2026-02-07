"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useGameAudio } from "../hooks/useGameAudio";

type Point = { x: number; y: number };
type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
};

const GRID_SIZE = 20;
const CANVAS_SIZE = 400;
const INITIAL_SPEED = 150;
const SPEED_INCREMENT = 10;
const FOOD_PER_STAGE = 10;

const SnakeGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const swipeConsumedRef = useRef(false);
  const { 
    isMuted, 
    toggleMute, 
    initAudio, 
    playEat, 
    playGameOver, 
    playStageClear, 
    playClick,
    startBGM, 
    stopBGM 
  } = useGameAudio();
  
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [hurdles, setHurdles] = useState<Point[]>([]);
  const [direction, setDirection] = useState<Point>({ x: 1, y: 0 });
  const [nextDirection, setNextDirection] = useState<Point>({ x: 1, y: 0 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    if (typeof window === "undefined") return 0;
    const saved = localStorage.getItem("snake-highscore");
    const parsed = saved ? parseInt(saved, 10) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  });
  const [foodInStage, setFoodInStage] = useState(0);
  const [stage, setStage] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [stageComplete, setStageComplete] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [shake, setShake] = useState(0);
  
  const requestRef = useRef<number>(null);
  const frameCountRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("snake-highscore", highScore.toString());
  }, [highScore]);

  // Handle BGM
  useEffect(() => {
    if (gameStarted && !gameOver && !stageComplete) {
      startBGM();
    } else {
      stopBGM();
    }
  }, [gameStarted, gameOver, stageComplete, startBGM, stopBGM]);

  const generateRandomPoint = useCallback((exclude: Point[]): Point => {
    let point: Point;
    const cols = CANVAS_SIZE / GRID_SIZE;
    const rows = CANVAS_SIZE / GRID_SIZE;
    do {
      point = {
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows),
      };
    } while (exclude.some((p) => p.x === point.x && p.y === point.y));
    return point;
  }, []);

  const createParticles = (x: number, y: number, color: string, count = 10) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        x: x * GRID_SIZE + GRID_SIZE / 2,
        y: y * GRID_SIZE + GRID_SIZE / 2,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1.0,
        color,
        size: Math.random() * 4 + 2,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
  };

  const startGame = async () => {
    await initAudio();
    playClick();
    resetGame();
  };

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setDirection({ x: 1, y: 0 });
    setNextDirection({ x: 1, y: 0 });
    setScore(0);
    setFoodInStage(0);
    setStage(1);
    setGameOver(false);
    setGameStarted(true);
    setStageComplete(false);
    setSpeed(INITIAL_SPEED);
    setHurdles([]);
    setParticles([]);
    setFood(generateRandomPoint([{ x: 10, y: 10 }]));
  };

  const handleNextStage = () => {
    playClick();
    const newStage = stage + 1;
    setStage(newStage);
    setSnake([{ x: 10, y: 10 }]);
    setDirection({ x: 1, y: 0 });
    setNextDirection({ x: 1, y: 0 });
    setStageComplete(false);
    setFoodInStage(0);
    setSpeed((prev) => Math.max(prev - SPEED_INCREMENT, 50));
    
    // Add hurdles
    const newHurdles: Point[] = [];
    for (let i = 0; i < newStage * 2; i++) {
      newHurdles.push(generateRandomPoint([{ x: 10, y: 10 }, food, ...newHurdles]));
    }
    setHurdles(newHurdles);
  };

  const moveSnake = useCallback(() => {
    if (gameOver || !gameStarted || stageComplete) return;

    const head = snake[0];
    const newHead = {
      x: head.x + nextDirection.x,
      y: head.y + nextDirection.y,
    };

    // Collision Checks
    let isCollision = false;
    if (newHead.x < 0 || newHead.x >= 20 || newHead.y < 0 || newHead.y >= 20) isCollision = true;
    else if (snake.some((p) => p.x === newHead.x && p.y === newHead.y)) isCollision = true;
    else if (hurdles.some((h) => h.x === newHead.x && h.y === newHead.y)) isCollision = true;

    if (isCollision) {
      setGameOver(true);
      playGameOver();
      createParticles(head.x, head.y, "#ff5252", 30);
      setShake(20); // Trigger screen shake
      return;
    }

    // Update Snake
    const didEatFood = newHead.x === food.x && newHead.y === food.y;
    const newSnake = [newHead, ...snake];
    
    if (!didEatFood) {
      newSnake.pop();
    }

    setSnake(newSnake);
    setDirection(nextDirection);

    if (didEatFood) {
      createParticles(food.x, food.y, "#4caf50", 20); // Green particles for food
      playEat();
      setScore((s) => {
        const next = s + 10;
        setHighScore((h) => (next > h ? next : h));
        return next;
      });
      setShake(5); // Small shake on eat
      
      const nextFoodInStage = foodInStage + 1;
      if (nextFoodInStage >= FOOD_PER_STAGE) {
        setStageComplete(true);
        playStageClear();
        setFoodInStage(0);
      } else {
        setFoodInStage(nextFoodInStage);
      }

      setFood(generateRandomPoint([...newSnake, ...hurdles]));
    }
  }, [snake, food, hurdles, nextDirection, foodInStage, gameOver, gameStarted, stageComplete, generateRandomPoint, playEat, playGameOver, playStageClear]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for arrow keys
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
      }
      
      switch (e.key) {
        case "ArrowUp":
          if (direction.y === 0) setNextDirection({ x: 0, y: -1 });
          break;
        case "ArrowDown":
          if (direction.y === 0) setNextDirection({ x: 0, y: 1 });
          break;
        case "ArrowLeft":
          if (direction.x === 0) setNextDirection({ x: -1, y: 0 });
          break;
        case "ArrowRight":
          if (direction.x === 0) setNextDirection({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [direction]);

  const applyDirection = useCallback((next: Point) => {
    if (next.x !== 0) {
      if (direction.x === 0) setNextDirection(next);
      return;
    }
    if (next.y !== 0) {
      if (direction.y === 0) setNextDirection(next);
    }
  }, [direction]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!gameStarted || gameOver || stageComplete) return;
    swipeStartRef.current = { x: e.clientX, y: e.clientY };
    swipeConsumedRef.current = false;
  }, [gameOver, gameStarted, stageComplete]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!gameStarted || gameOver || stageComplete) return;
    const start = swipeStartRef.current;
    if (!start) return;

    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const threshold = 18;

    if (absX < threshold && absY < threshold) return;
    if (swipeConsumedRef.current) return;

    swipeConsumedRef.current = true;
    swipeStartRef.current = { x: e.clientX, y: e.clientY };

    if (absX > absY) {
      applyDirection(dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 });
    } else {
      applyDirection(dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 });
    }
  }, [applyDirection, gameOver, gameStarted, stageComplete]);

  const handlePointerUp = useCallback(() => {
    swipeStartRef.current = null;
    swipeConsumedRef.current = false;
  }, []);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      const interval = setInterval(moveSnake, speed);
      return () => clearInterval(interval);
    }
  }, [moveSnake, speed, gameStarted, gameOver]);

  // Animation Loop (Particles, Shake decay, Grid pulse)
  useEffect(() => {
    const update = () => {
      frameCountRef.current++;

      // Update particles
      setParticles((prev) => 
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            life: p.life - 0.02,
          }))
          .filter((p) => p.life > 0)
      );

      // Decay shake
      setShake((prev) => (prev > 0 ? prev * 0.9 : 0));

      requestRef.current = requestAnimationFrame(update);
    };

    requestRef.current = requestAnimationFrame(update);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // Canvas Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Apply Shake
    const shakeX = (Math.random() - 0.5) * shake;
    const shakeY = (Math.random() - 0.5) * shake;
    
    ctx.save();
    ctx.translate(shakeX, shakeY);

    // Clear and Fill Background
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw Animated Grid
    const pulse = Math.sin(frameCountRef.current * 0.05) * 0.2 + 0.3; // 0.1 to 0.5
    ctx.strokeStyle = `rgba(0, 255, 255, ${pulse * 0.1})`;
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let i = 0; i <= canvas.width; i += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    // Horizontal lines
    for (let i = 0; i <= canvas.height; i += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Draw Particles
    particles.forEach((p) => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = p.size * 2;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
    ctx.globalAlpha = 1.0;

    // Draw Hurdles
    hurdles.forEach((h) => {
      const x = h.x * GRID_SIZE;
      const y = h.y * GRID_SIZE;
      
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
      
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 10;
      ctx.strokeRect(x + 2, y + 2, GRID_SIZE - 4, GRID_SIZE - 4);
      
      // X mark
      ctx.beginPath();
      ctx.moveTo(x + 4, y + 4);
      ctx.lineTo(x + GRID_SIZE - 4, y + GRID_SIZE - 4);
      ctx.moveTo(x + GRID_SIZE - 4, y + 4);
      ctx.lineTo(x + 4, y + GRID_SIZE - 4);
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    // Draw Food
    const foodPulse = Math.sin(frameCountRef.current * 0.1) * 5 + 10;
    ctx.shadowBlur = foodPulse;
    ctx.shadowColor = "#4caf50";
    ctx.fillStyle = "#4caf50";
    ctx.beginPath();
    ctx.arc(
      food.x * GRID_SIZE + GRID_SIZE / 2,
      food.y * GRID_SIZE + GRID_SIZE / 2,
      GRID_SIZE / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Snake
    snake.forEach((p, i) => {
      const x = p.x * GRID_SIZE;
      const y = p.y * GRID_SIZE;
      const isHead = i === 0;
      
      ctx.save();
      ctx.translate(x + GRID_SIZE / 2, y + GRID_SIZE / 2);
      
      // Glow
      ctx.shadowBlur = isHead ? 20 : 10;
      ctx.shadowColor = isHead ? "#00e5ff" : "#00bcd4";
      
      ctx.fillStyle = isHead ? "#00e5ff" : "#00bcd4";
      
      // Draw rounded rect or circle
      if (isHead) {
        ctx.beginPath();
        ctx.arc(0, 0, GRID_SIZE / 2 - 1, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.shadowBlur = 0;
        ctx.fillStyle = "black";
        
        // Rotate eyes based on direction (simplified)
        let eyeAngle = 0;
        if (direction.x === 1) eyeAngle = 0;
        else if (direction.x === -1) eyeAngle = Math.PI;
        else if (direction.y === 1) eyeAngle = Math.PI / 2;
        else if (direction.y === -1) eyeAngle = -Math.PI / 2;
        
        ctx.rotate(eyeAngle);
        ctx.fillRect(2, -4, 4, 4); // Right/Top eye
        ctx.fillRect(2, 0, 4, 4);  // Right/Bottom eye
        
      } else {
        // Body segment - slightly smaller to show separation
        ctx.fillRect(-GRID_SIZE / 2 + 1, -GRID_SIZE / 2 + 1, GRID_SIZE - 2, GRID_SIZE - 2);
      }
      
      ctx.restore();
    });

    ctx.restore(); // Restore translate from shake
  }, [snake, food, hurdles, particles, direction, shake]);

  return (
    <div className="relative flex flex-col items-center gap-6 p-4 select-none min-h-screen justify-center font-orbitron overflow-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[#020202]">
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(0,229,255,0.1),transparent_70%)]"></div>
         {/* Grid overlay */}
         <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.05)_1px,transparent_1px)] bg-[length:40px_40px] opacity-20 perspective-[500px] rotate-x-12 scale-150"></div>
      </div>

      {/* HUD */}
      <div className="relative z-10 w-full max-w-[420px] flex justify-between items-end mb-2">
        <div className="flex flex-col">
          <span className="text-xs text-cyan-500 font-bold tracking-widest mb-1 font-press-start">SCORE</span>
          <span className="text-3xl text-white drop-shadow-[0_0_10px_rgba(0,229,255,0.8)] font-press-start">
            {score.toString().padStart(6, '0')}
          </span>
        </div>
        
        <div className="flex flex-col items-end">
          <span className="text-xs text-amber-500 font-bold tracking-widest mb-1 font-press-start">STAGE {stage}</span>
          <div className="flex gap-1 h-2">
            {[...Array(FOOD_PER_STAGE)].map((_, i) => (
               <div 
                 key={i} 
                 className={`w-2 h-2 ${i < foodInStage ? 'bg-cyan-400 shadow-[0_0_8px_cyan]' : 'bg-zinc-800'}`}
               />
            ))}
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="relative group z-10">
        {/* Bezel */}
        <div className="relative border-4 border-zinc-800 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,229,255,0.15)] bg-black">
          
          {/* CRT Overlay */}
          <div className="absolute inset-0 pointer-events-none z-30 opacity-40">
            <div className="w-full h-full bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,6px_100%]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_60%,rgba(0,0,0,0.8)_100%)]"></div>
          </div>

          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="block max-w-[min(92vw,400px)] max-h-[70vh] w-auto h-auto"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
              imageRendering: 'pixelated',
              touchAction: 'none',
              filter: `blur(${shake > 0 ? 1 : 0}px)`
            }}
          />

          {/* Overlays */}
          {!gameStarted && !gameOver && !stageComplete && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-40">
              <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-blue-600 mb-8 drop-shadow-[0_0_20px_rgba(0,229,255,0.5)] font-orbitron italic">
                NEON SNAKE
              </h1>
              <button 
                onClick={startGame}
                className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-none border-2 border-cyan-400 shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all hover:scale-105 active:scale-95 font-press-start text-xs"
              >
                INSERT COIN / START
              </button>
              <div className="mt-8 text-cyan-800 text-[10px] font-press-start animate-pulse">
                PRESS ARROW KEYS TO MOVE
              </div>
              <Link href="/" className="mt-4 text-zinc-500 hover:text-cyan-400 text-xs font-press-start hover:underline">
                EXIT TO MENU
              </Link>
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/90 backdrop-blur-sm z-40 animate-in fade-in zoom-in duration-300">
              <h2 className="text-5xl font-black text-red-500 mb-2 font-orbitron drop-shadow-[0_0_10px_red]">GAME OVER</h2>
              <p className="text-white font-press-start text-sm mb-6">SCORE: {score}</p>
              <button 
                onClick={startGame}
                className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold border-2 border-red-400 shadow-[0_0_20px_red] transition-all hover:scale-105 active:scale-95 font-press-start text-xs"
              >
                TRY AGAIN
              </button>
              <Link href="/" className="mt-4 text-zinc-400 hover:text-white text-xs font-press-start hover:underline">
                EXIT TO MENU
              </Link>
            </div>
          )}

          {stageComplete && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-cyan-900/90 backdrop-blur-sm z-40 animate-in fade-in zoom-in duration-300">
              <h2 className="text-4xl font-black text-cyan-400 mb-2 font-orbitron drop-shadow-[0_0_10px_cyan]">STAGE CLEARED</h2>
              <p className="text-white font-press-start text-[10px] mb-6 animate-pulse">PREPARE FOR NEXT LEVEL</p>
              <button 
                onClick={handleNextStage}
                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold border-2 border-cyan-400 shadow-[0_0_20px_cyan] transition-all hover:scale-105 active:scale-95 font-press-start text-xs"
              >
                NEXT STAGE
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-[420px] md:hidden flex items-center justify-between gap-4 mt-2">
        <div className="grid grid-cols-3 gap-2">
          <div />
          <button
            onClick={() => applyDirection({ x: 0, y: -1 })}
            className="w-14 h-14 bg-zinc-900 border border-cyan-500/40 text-cyan-300 font-press-start text-[10px] shadow-[0_0_15px_rgba(0,229,255,0.15)] active:scale-95"
            type="button"
          >
            UP
          </button>
          <div />
          <button
            onClick={() => applyDirection({ x: -1, y: 0 })}
            className="w-14 h-14 bg-zinc-900 border border-cyan-500/40 text-cyan-300 font-press-start text-[10px] shadow-[0_0_15px_rgba(0,229,255,0.15)] active:scale-95"
            type="button"
          >
            LEFT
          </button>
          <button
            onClick={() => applyDirection({ x: 0, y: 1 })}
            className="w-14 h-14 bg-zinc-900 border border-cyan-500/40 text-cyan-300 font-press-start text-[10px] shadow-[0_0_15px_rgba(0,229,255,0.15)] active:scale-95"
            type="button"
          >
            DOWN
          </button>
          <button
            onClick={() => applyDirection({ x: 1, y: 0 })}
            className="w-14 h-14 bg-zinc-900 border border-cyan-500/40 text-cyan-300 font-press-start text-[10px] shadow-[0_0_15px_rgba(0,229,255,0.15)] active:scale-95"
            type="button"
          >
            RIGHT
          </button>
        </div>

        <div className="flex flex-col items-end gap-2 text-zinc-500 text-[10px] font-press-start">
          <span>SWIPE OR TAP</span>
          <span>BUTTONS</span>
        </div>
      </div>

      {/* Controls / Footer */}
      <div className="w-full max-w-[420px] flex justify-between items-center text-zinc-500 text-xs font-press-start mt-4">
         <span>HIGH: {highScore}</span>
         <button 
           onClick={toggleMute}
           className="flex items-center gap-2 hover:text-cyan-400 transition-colors"
         >
           {isMuted ? "🔇 SOUND OFF" : "🔊 SOUND ON"}
         </button>
      </div>
    </div>
  );
};

export default SnakeGame;
