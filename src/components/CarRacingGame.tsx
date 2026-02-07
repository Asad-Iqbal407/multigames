"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { 
  useCarRacing, 
  ROAD_WIDTH, 
  ROAD_HEIGHT, 
  CAR_WIDTH, 
  CAR_HEIGHT 
} from "../hooks/useCarRacing";

const CarRacingGame: React.FC = () => {
  const {
    gameState,
    score,
    highScore,
    mission,
    missionTarget,
    speed,
    curve,
    playerX,
    playerY,
    playerZ,
    obstacles,
    startGame,
    movePlayer,
    jump,
    accelerate,
    brake,
    handleTouchStart,
    handleTouchMove
  } = useCarRacing();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ playerX, playerY, playerZ, obstacles, gameState, speed, curve, score, mission, missionTarget });

  useEffect(() => {
    stateRef.current = { playerX, playerY, playerZ, obstacles, gameState, speed, curve, score, mission, missionTarget };
  }, [playerX, playerY, playerZ, obstacles, gameState, speed, curve, score, mission, missionTarget]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let asphaltPattern: CanvasPattern | null = null;
    let lastTime = performance.now();
    let dashOffset = 0;
    let lastPlayerX = stateRef.current.playerX;
    let lastPlayerY = stateRef.current.playerY;

    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;

      const targetWidth = rect.width * dpr;
      const targetHeight = rect.height * dpr;

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }
      
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr * (rect.width / ROAD_WIDTH), dpr * (rect.height / ROAD_HEIGHT));
      return true;
    };

    const draw = () => {
      const { playerX: pX, playerY: pY, playerZ: pZ, obstacles: obsList, speed: spd, curve: crv, mission: msn } = stateRef.current;
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      dashOffset += dt * (120 + spd * 18);

      if (!asphaltPattern) {
        const off = document.createElement("canvas");
        off.width = 128;
        off.height = 128;
        const octx = off.getContext("2d");
        if (octx) {
          octx.fillStyle = "#151515";
          octx.fillRect(0, 0, off.width, off.height);
          for (let i = 0; i < 500; i += 1) {
            const x = Math.random() * off.width;
            const y = Math.random() * off.height;
            const r = Math.random() * 1.6 + 0.3;
            const a = Math.random() * 0.07;
            octx.fillStyle = `rgba(255,255,255,${a})`;
            octx.beginPath();
            octx.arc(x, y, r, 0, Math.PI * 2);
            octx.fill();
          }
          for (let i = 0; i < 220; i += 1) {
            const x = Math.random() * off.width;
            const y = Math.random() * off.height;
            const r = Math.random() * 2.2 + 0.8;
            const a = Math.random() * 0.05;
            octx.fillStyle = `rgba(0,0,0,${a})`;
            octx.beginPath();
            octx.arc(x, y, r, 0, Math.PI * 2);
            octx.fill();
          }
        }
        asphaltPattern = ctx.createPattern(off, "repeat");
      }

      const sceneIndex = (msn - 1) % 3;
      const scene = sceneIndex === 0 ? "desert" : sceneIndex === 1 ? "mountains" : "night";

      if (scene === "desert") {
        const sky = ctx.createLinearGradient(0, 0, 0, ROAD_HEIGHT);
        sky.addColorStop(0, "#79c8ff");
        sky.addColorStop(0.6, "#f8e1b5");
        sky.addColorStop(1, "#e8bf85");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, ROAD_WIDTH, ROAD_HEIGHT);

        ctx.fillStyle = "rgba(255, 225, 160, 0.9)";
        ctx.beginPath();
        ctx.arc(ROAD_WIDTH * 0.78, ROAD_HEIGHT * 0.18, 28, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(120, 90, 60, 0.18)";
        ctx.beginPath();
        ctx.moveTo(0, ROAD_HEIGHT * 0.46);
        ctx.lineTo(ROAD_WIDTH * 0.25, ROAD_HEIGHT * 0.34);
        ctx.lineTo(ROAD_WIDTH * 0.55, ROAD_HEIGHT * 0.48);
        ctx.lineTo(ROAD_WIDTH * 0.9, ROAD_HEIGHT * 0.32);
        ctx.lineTo(ROAD_WIDTH, ROAD_HEIGHT * 0.5);
        ctx.lineTo(ROAD_WIDTH, ROAD_HEIGHT);
        ctx.lineTo(0, ROAD_HEIGHT);
        ctx.closePath();
        ctx.fill();

        const sand = ctx.createLinearGradient(0, ROAD_HEIGHT * 0.45, 0, ROAD_HEIGHT);
        sand.addColorStop(0, "#caa66a");
        sand.addColorStop(1, "#7f5b2a");
        ctx.fillStyle = sand;
        ctx.fillRect(0, ROAD_HEIGHT * 0.45, ROAD_WIDTH, ROAD_HEIGHT * 0.55);
      } else if (scene === "mountains") {
        const sky = ctx.createLinearGradient(0, 0, 0, ROAD_HEIGHT);
        sky.addColorStop(0, "#2b2f63");
        sky.addColorStop(0.55, "#ff7a59");
        sky.addColorStop(1, "#2b1716");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, ROAD_WIDTH, ROAD_HEIGHT);

        ctx.fillStyle = "rgba(30, 18, 24, 0.7)";
        ctx.beginPath();
        ctx.moveTo(0, ROAD_HEIGHT * 0.52);
        ctx.lineTo(ROAD_WIDTH * 0.18, ROAD_HEIGHT * 0.33);
        ctx.lineTo(ROAD_WIDTH * 0.32, ROAD_HEIGHT * 0.46);
        ctx.lineTo(ROAD_WIDTH * 0.52, ROAD_HEIGHT * 0.28);
        ctx.lineTo(ROAD_WIDTH * 0.7, ROAD_HEIGHT * 0.44);
        ctx.lineTo(ROAD_WIDTH * 0.88, ROAD_HEIGHT * 0.3);
        ctx.lineTo(ROAD_WIDTH, ROAD_HEIGHT * 0.48);
        ctx.lineTo(ROAD_WIDTH, ROAD_HEIGHT);
        ctx.lineTo(0, ROAD_HEIGHT);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
        ctx.fillRect(0, ROAD_HEIGHT * 0.56, ROAD_WIDTH, ROAD_HEIGHT * 0.44);
      } else {
        const sky = ctx.createLinearGradient(0, 0, 0, ROAD_HEIGHT);
        sky.addColorStop(0, "#030714");
        sky.addColorStop(0.55, "#081836");
        sky.addColorStop(1, "#05070b");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, ROAD_WIDTH, ROAD_HEIGHT);

        for (let i = 0; i < 55; i += 1) {
          const s = i * 999.91;
          const x = (Math.sin(s) * 0.5 + 0.5) * ROAD_WIDTH;
          const y = (Math.sin(s * 0.73 + 3.1) * 0.5 + 0.5) * (ROAD_HEIGHT * 0.5);
          const a = 0.25 + (Math.sin(s * 0.17) * 0.5 + 0.5) * 0.6;
          ctx.fillStyle = `rgba(255,255,255,${a})`;
          ctx.fillRect(x, y, 1.5, 1.5);
        }

        ctx.fillStyle = "rgba(170, 190, 255, 0.18)";
        ctx.beginPath();
        ctx.arc(ROAD_WIDTH * 0.18, ROAD_HEIGHT * 0.16, 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(0, ROAD_HEIGHT * 0.55, ROAD_WIDTH, ROAD_HEIGHT * 0.45);
      }

      const roadPadding = 38;
      const steps = 30;
      const leftXs: number[] = [];
      const rightXs: number[] = [];
      const ys: number[] = [];

      for (let i = 0; i <= steps; i += 1) {
        const y = (i / steps) * ROAD_HEIGHT;
        const t = y / ROAD_HEIGHT;
        const offset = crv * t * 95;
        leftXs.push(roadPadding + offset);
        rightXs.push(ROAD_WIDTH - roadPadding + offset);
        ys.push(y);
      }

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(leftXs[0], ys[0]);
      for (let i = 1; i <= steps; i += 1) ctx.lineTo(leftXs[i], ys[i]);
      for (let i = steps; i >= 0; i -= 1) ctx.lineTo(rightXs[i], ys[i]);
      ctx.closePath();
      ctx.clip();

      ctx.fillStyle = asphaltPattern ?? "#141414";
      ctx.fillRect(0, 0, ROAD_WIDTH, ROAD_HEIGHT);

      const roadLight = ctx.createLinearGradient(0, 0, 0, ROAD_HEIGHT);
      roadLight.addColorStop(0, "rgba(255,255,255,0.06)");
      roadLight.addColorStop(0.5, "rgba(255,255,255,0.02)");
      roadLight.addColorStop(1, "rgba(0,0,0,0.25)");
      ctx.fillStyle = roadLight;
      ctx.fillRect(0, 0, ROAD_WIDTH, ROAD_HEIGHT);

      ctx.restore();

      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.beginPath();
      ctx.moveTo(leftXs[0], ys[0]);
      for (let i = 1; i <= steps; i += 1) ctx.lineTo(leftXs[i], ys[i]);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(rightXs[0], ys[0]);
      for (let i = 1; i <= steps; i += 1) ctx.lineTo(rightXs[i], ys[i]);
      ctx.stroke();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
      ctx.setLineDash([26, 26]);
      ctx.lineDashOffset = -dashOffset;
      ctx.lineWidth = 2;

      for (let lane = 1; lane <= 2; lane += 1) {
        ctx.beginPath();
        const x0 = leftXs[0] + ((rightXs[0] - leftXs[0]) * lane) / 3;
        ctx.moveTo(x0, ys[0]);
        for (let i = 1; i <= steps; i += 1) {
          const x = leftXs[i] + ((rightXs[i] - leftXs[i]) * lane) / 3;
          ctx.lineTo(x, ys[i]);
        }
        ctx.stroke();
      }

      ctx.save();
      
      const dx = pX - lastPlayerX;
      const dy = pY - lastPlayerY;
      lastPlayerX = pX;
      lastPlayerY = pY;
      const tilt = Math.max(-0.18, Math.min(0.18, dx / 180 - dy / 320));
      const scale = 1 + (pZ / 220);
      const centerX = pX + CAR_WIDTH / 2;
      const centerY = pY + CAR_HEIGHT / 2;
      
      const shadowScale = Math.max(0.5, 1 - pZ / 150);
      const shadowAlpha = Math.max(0.2, 0.6 - pZ / 100);
      ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY + CAR_HEIGHT/2 - 5, (CAR_WIDTH/2 + 5) * shadowScale, (10) * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.translate(centerX, centerY);
      ctx.translate(0, -pZ);
      ctx.rotate(tilt);
      ctx.scale(scale, scale);
      ctx.translate(-centerX, -centerY);

      const carBodyGradient = ctx.createLinearGradient(pX, pY, pX + CAR_WIDTH, pY);
      carBodyGradient.addColorStop(0, "#D7D7D7");
      carBodyGradient.addColorStop(0.22, "#7B7B7B");
      carBodyGradient.addColorStop(0.5, "#B0B0B0");
      carBodyGradient.addColorStop(0.78, "#5F5F5F");
      carBodyGradient.addColorStop(1, "#D7D7D7");
      
      ctx.shadowBlur = 10;
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.fillStyle = carBodyGradient;
      roundRect(ctx, pX, pY, CAR_WIDTH, CAR_HEIGHT, 8);
      ctx.fill();
      
      ctx.fillStyle = "rgba(10,10,12,0.85)";
      ctx.beginPath();
      ctx.moveTo(pX + 5, pY + 20);
      ctx.lineTo(pX + CAR_WIDTH - 5, pY + 20);
      ctx.lineTo(pX + CAR_WIDTH - 8, pY + 10);
      ctx.lineTo(pX + 8, pY + 10);
      ctx.closePath();
      ctx.fill();
      
      ctx.fillStyle = "#4D4D4D";
      ctx.fillRect(pX + 6, pY + 20, CAR_WIDTH - 12, 25);
      
      ctx.fillStyle = "rgba(10,10,12,0.85)";
      ctx.beginPath();
      ctx.moveTo(pX + 6, pY + 45);
      ctx.lineTo(pX + CAR_WIDTH - 6, pY + 45);
      ctx.lineTo(pX + CAR_WIDTH - 8, pY + 52);
      ctx.lineTo(pX + 8, pY + 52);
      ctx.closePath();
      ctx.fill();
      
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(pX + CAR_WIDTH/2 - 3, pY + 5, 6, 15);
      ctx.fillStyle = "rgba(255,255,255,0.14)";
      ctx.fillRect(pX + 7, pY + 8, 3, CAR_HEIGHT - 16);

      ctx.shadowBlur = 5;
      ctx.shadowColor = "rgba(255,240,190,0.95)";
      ctx.fillStyle = "rgba(255,250,230,0.95)";
      ctx.beginPath();
      ctx.arc(pX + 6, pY + 4, 3, 0, Math.PI * 2);
      ctx.arc(pX + CAR_WIDTH - 6, pY + 4, 3, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.shadowColor = "rgba(255,60,60,0.9)";
      ctx.fillStyle = "rgba(255,40,40,0.95)";
      ctx.fillRect(pX + 4, pY + CAR_HEIGHT - 4, 8, 4);
      ctx.fillRect(pX + CAR_WIDTH - 12, pY + CAR_HEIGHT - 4, 8, 4);
      
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#444";
      ctx.fillRect(pX + 2, pY + CAR_HEIGHT - 8, CAR_WIDTH - 4, 3);

      ctx.restore();

      obsList.forEach(obs => {
        ctx.shadowBlur = 5;
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        
        if (obs.type === 'car') {
           ctx.fillStyle = obs.color || "#2E6BE6";
           roundRect(ctx, obs.x, obs.y, CAR_WIDTH, CAR_HEIGHT, 5);
           ctx.fill();
           
           ctx.fillStyle = "rgba(0,0,0,0.55)";
           ctx.fillRect(obs.x + 5, obs.y + 15, CAR_WIDTH - 10, 30);
           
           ctx.fillStyle = "rgba(255,220,150,0.95)";
           ctx.fillRect(obs.x + 2, obs.y + CAR_HEIGHT - 2, 6, 2);
           ctx.fillRect(obs.x + CAR_WIDTH - 8, obs.y + CAR_HEIGHT - 2, 6, 2);
        } else {
          ctx.fillStyle = "#333";
          ctx.beginPath();
          ctx.ellipse(obs.x + CAR_WIDTH/2, obs.y + CAR_HEIGHT/2, CAR_WIDTH/2, CAR_WIDTH/3, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#444";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });

      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;
      const vignette = ctx.createRadialGradient(ROAD_WIDTH / 2, ROAD_HEIGHT * 0.55, 80, ROAD_WIDTH / 2, ROAD_HEIGHT * 0.55, 430);
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,0.55)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, ROAD_WIDTH, ROAD_HEIGHT);
    };

    function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    }

    const render = () => {
      if (updateCanvasSize()) {
        draw();
      }
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") movePlayer("left");
      if (e.key === "ArrowRight" || e.key === "d") movePlayer("right");
      if (e.key === "ArrowUp" || e.key === "w") movePlayer("up");
      if (e.key === "ArrowDown" || e.key === "s") movePlayer("down");
      if (e.key === " " || e.key === "Spacebar") jump();
      if (e.key === "e" || e.key === "E" || e.key === "=" || e.key === "+") accelerate();
      if (e.key === "q" || e.key === "Q" || e.key === "-" || e.key === "_") brake();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [movePlayer, jump, accelerate, brake]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 p-4 font-mono">
      <div className="mb-4 text-center">
        <h1 className="text-4xl font-black tracking-tight text-zinc-100 mb-2">
          URBAN RACER
        </h1>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-zinc-200 text-lg">
          <p>MISSION: {mission}</p>
          <p>PROGRESS: {score}/{missionTarget}</p>
          <p>BEST: {highScore}</p>
          <p>SPD: {Math.round(speed * 14)}</p>
        </div>
      </div>

      <div className="relative group">
        <canvas
          ref={canvasRef}
          className="border border-zinc-700/70 rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.65)] touch-none w-auto h-auto max-w-[min(96vw,720px)] max-h-[65vh] aspect-[420/520] bg-black"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
        />

        {gameState === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm rounded-xl">
            <button
              onClick={startGame}
              className="px-10 py-4 bg-zinc-100 text-black font-black text-xl rounded-full hover:bg-white transition-all hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            >
              START
            </button>
            <p className="mt-4 text-zinc-300/80 text-xs tracking-wide">
              WASD / ARROWS TO MOVE · SPACE TO JUMP · E/Q SPEED
            </p>
          </div>
        )}

        {gameState === "gameover" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-xl">
            <h2 className="text-5xl font-black text-red-400 mb-3">CRASHED</h2>
            <p className="text-xl text-zinc-200 mb-8">FINAL SCORE: {score}</p>
            <button
              onClick={startGame}
              className="px-10 py-4 bg-zinc-100 text-black font-black text-xl rounded-full hover:bg-white transition-all hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)] mb-4"
            >
              RETRY
            </button>
          </div>
        )}

        {gameState === "mission" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm rounded-xl">
            <h2 className="text-4xl font-black text-emerald-300 mb-3">MISSION COMPLETE</h2>
            <p className="text-base text-zinc-200">STARTING MISSION {mission + 1}</p>
          </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-3 gap-2 md:hidden w-full max-w-[300px]">
        <div className="col-start-2">
          <button
            className="w-full aspect-square bg-zinc-900/60 border border-zinc-700 rounded-xl text-zinc-100 active:bg-zinc-100 active:text-black transition-colors flex items-center justify-center"
            onPointerDown={() => movePlayer("up")}
          >
            ↑
          </button>
        </div>
        <div className="col-start-1 row-start-2">
          <button
            className="w-full aspect-square bg-zinc-900/60 border border-zinc-700 rounded-xl text-zinc-100 active:bg-zinc-100 active:text-black transition-colors flex items-center justify-center"
            onPointerDown={() => movePlayer("left")}
          >
            ←
          </button>
        </div>
        <div className="col-start-2 row-start-2">
          <button
            className="w-full aspect-square bg-zinc-900/60 border border-zinc-700 rounded-xl text-zinc-100 active:bg-zinc-100 active:text-black transition-colors flex items-center justify-center"
            onPointerDown={() => movePlayer("down")}
          >
            ↓
          </button>
        </div>
        <div className="col-start-3 row-start-2">
          <button
            className="w-full aspect-square bg-zinc-900/60 border border-zinc-700 rounded-xl text-zinc-100 active:bg-zinc-100 active:text-black transition-colors flex items-center justify-center"
            onPointerDown={() => movePlayer("right")}
          >
            →
          </button>
        </div>
        <div className="col-start-2 row-start-3">
          <button
            className="w-full aspect-square bg-red-950/60 border border-red-700 rounded-xl text-red-200 active:bg-red-400 active:text-black transition-colors flex items-center justify-center font-black text-xs tracking-wide"
            onPointerDown={() => jump()}
          >
            JUMP
          </button>
        </div>
        <div className="col-start-1 row-start-3">
          <button
            className="w-full aspect-square bg-zinc-900/60 border border-zinc-700 rounded-xl text-zinc-100 active:bg-zinc-100 active:text-black transition-colors flex items-center justify-center font-black text-xs tracking-wide"
            onPointerDown={() => brake()}
          >
            BRAKE
          </button>
        </div>
        <div className="col-start-3 row-start-3">
          <button
            className="w-full aspect-square bg-zinc-900/60 border border-zinc-700 rounded-xl text-zinc-100 active:bg-zinc-100 active:text-black transition-colors flex items-center justify-center font-black text-xs tracking-wide"
            onPointerDown={() => accelerate()}
          >
            SPEED
          </button>
        </div>
      </div>

      <Link
        href="/"
        className="mt-8 text-zinc-400 hover:text-zinc-100 transition-colors flex items-center gap-2"
      >
        ← BACK TO ARCADE
      </Link>
    </div>
  );
};

export default CarRacingGame;
