"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

const WORLD_WIDTH = 420;
const WORLD_HEIGHT = 620;

type GameState = "idle" | "playing" | "gameover";

type Vec2 = { x: number; y: number };

type Player = {
  x: number;
  y: number;
  r: number;
  invulnUntilMs: number;
};

type Bullet = {
  id: number;
  x: number;
  y: number;
  vy: number;
};

type Enemy = {
  id: number;
  x: number;
  y: number;
  vy: number;
  r: number;
  hp: number;
  color: string;
};

type Particle = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
};

type Star = {
  x: number;
  y: number;
  vy: number;
  size: number;
  a: number;
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const dist2 = (a: Vec2, b: Vec2) => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
};

const StarWarGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [gameState, setGameState] = useState<GameState>("idle");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [highScore, setHighScore] = useState(() => {
    if (typeof window === "undefined") return 0;
    const saved = localStorage.getItem("starwar-highscore");
    const n = saved ? parseInt(saved, 10) : 0;
    return Number.isFinite(n) ? n : 0;
  });

  const gameStateRef = useRef<GameState>("idle");
  const scoreRef = useRef(0);
  const livesRef = useRef(3);

  const playerRef = useRef<Player>({
    x: WORLD_WIDTH / 2,
    y: WORLD_HEIGHT - 80,
    r: 18,
    invulnUntilMs: 0
  });
  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<Star[]>([]);

  const nextIdRef = useRef(1);
  const lastEnemySpawnMsRef = useRef(0);
  const lastShotMsRef = useRef(0);
  const lastTickMsRef = useRef<number | null>(null);

  const keysRef = useRef({
    left: false,
    right: false,
    up: false,
    down: false,
    shoot: false
  });

  const pointerTargetRef = useRef<{ active: boolean; x: number; y: number }>({
    active: false,
    x: WORLD_WIDTH / 2,
    y: WORLD_HEIGHT - 80
  });

  useEffect(() => {
    if (starsRef.current.length) return;
    const arr: Star[] = [];
    for (let i = 0; i < 90; i += 1) {
      arr.push({
        x: Math.random() * WORLD_WIDTH,
        y: Math.random() * WORLD_HEIGHT,
        vy: 40 + Math.random() * 160,
        size: 0.8 + Math.random() * 1.8,
        a: 0.15 + Math.random() * 0.65
      });
    }
    starsRef.current = arr;
  }, []);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);
  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);

  const resetWorld = useCallback(() => {
    playerRef.current = {
      x: WORLD_WIDTH / 2,
      y: WORLD_HEIGHT - 80,
      r: 18,
      invulnUntilMs: performance.now() + 800
    };
    bulletsRef.current = [];
    enemiesRef.current = [];
    particlesRef.current = [];
    scoreRef.current = 0;
    livesRef.current = 3;
    setScore(0);
    setLives(3);
    lastEnemySpawnMsRef.current = performance.now();
    lastShotMsRef.current = 0;
    lastTickMsRef.current = null;
  }, []);

  const setGameOver = useCallback(() => {
    setGameState("gameover");
    const final = scoreRef.current;
    setHighScore(prev => {
      if (final > prev) {
        localStorage.setItem("starwar-highscore", String(final));
        return final;
      }
      return prev;
    });
  }, []);

  const startGame = useCallback(() => {
    resetWorld();
    setGameState("playing");
  }, [resetWorld]);

  const fire = useCallback((nowMs: number) => {
    if (gameStateRef.current !== "playing") return;
    const cooldownMs = 140;
    if (nowMs - lastShotMsRef.current < cooldownMs) return;
    lastShotMsRef.current = nowMs;

    const id = nextIdRef.current++;
    const p = playerRef.current;
    bulletsRef.current = [
      ...bulletsRef.current,
      { id, x: p.x, y: p.y - p.r - 6, vy: -640 }
    ];
  }, []);

  const screenToWorld = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 };
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 };
    const nx = (clientX - rect.left) / rect.width;
    const ny = (clientY - rect.top) / rect.height;
    return { x: clamp(nx * WORLD_WIDTH, 0, WORLD_WIDTH), y: clamp(ny * WORLD_HEIGHT, 0, WORLD_HEIGHT) };
  }, []);

  const handleCanvasPointerDown = useCallback((e: React.PointerEvent) => {
    if (gameStateRef.current === "idle") {
      startGame();
    }
    if (gameStateRef.current !== "playing") return;
    const canvas = canvasRef.current;
    canvas?.setPointerCapture(e.pointerId);
    const p = screenToWorld(e.clientX, e.clientY);
    pointerTargetRef.current = { active: true, x: p.x, y: p.y };
    fire(performance.now());
  }, [fire, screenToWorld, startGame]);

  const handleCanvasPointerMove = useCallback((e: React.PointerEvent) => {
    if (!pointerTargetRef.current.active) return;
    const p = screenToWorld(e.clientX, e.clientY);
    pointerTargetRef.current = { active: true, x: p.x, y: p.y };
  }, [screenToWorld]);

  const handleCanvasPointerUp = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (canvas?.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
    pointerTargetRef.current.active = false;
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === "Enter" && gameStateRef.current !== "playing") {
        startGame();
      }
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keysRef.current.left = true;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keysRef.current.right = true;
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") keysRef.current.up = true;
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") keysRef.current.down = true;
      if (e.key === " " || e.key === "Spacebar") keysRef.current.shoot = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keysRef.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keysRef.current.right = false;
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") keysRef.current.up = false;
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") keysRef.current.down = false;
      if (e.key === " " || e.key === "Spacebar") keysRef.current.shoot = false;
    };

    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown as EventListener);
      window.removeEventListener("keyup", onKeyUp as EventListener);
    };
  }, [startGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;

    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;

      const targetW = Math.floor(rect.width * dpr);
      const targetH = Math.floor(rect.height * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr * (rect.width / WORLD_WIDTH), dpr * (rect.height / WORLD_HEIGHT));
      return true;
    };

    const spawnEnemy = (nowMs: number) => {
      const enemiesInView = enemiesRef.current.filter(e => e.y > -80 && e.y < WORLD_HEIGHT + 80).length;
      const maxEnemies = 7;
      if (enemiesInView >= maxEnemies) return;

      const baseEvery = Math.max(380, 920 - scoreRef.current * 3);
      if (nowMs - lastEnemySpawnMsRef.current < baseEvery) return;
      lastEnemySpawnMsRef.current = nowMs;

      const id = nextIdRef.current++;
      const r = 16 + Math.random() * 12;
      const x = r + Math.random() * (WORLD_WIDTH - r * 2);
      const y = -r - 20;
      const vy = 90 + Math.random() * 150 + Math.min(220, scoreRef.current * 0.6);
      const palette = ["#ff3b3b", "#ff7a18", "#ff2fd6", "#a855f7"];
      const color = palette[Math.floor(Math.random() * palette.length)];

      enemiesRef.current = [
        ...enemiesRef.current,
        { id, x, y, vy, r, hp: 1, color }
      ];
    };

    const explode = (x: number, y: number, base: string) => {
      const parts: Particle[] = [];
      for (let i = 0; i < 18; i += 1) {
        const a = (Math.PI * 2 * i) / 18 + (Math.random() * 0.4 - 0.2);
        const sp = 80 + Math.random() * 220;
        parts.push({
          id: nextIdRef.current++,
          x,
          y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: 0.55 + Math.random() * 0.35,
          color: base,
          size: 1.2 + Math.random() * 2.2
        });
      }
      particlesRef.current = [...particlesRef.current, ...parts];
    };

    const tick = (nowMs: number) => {
      const last = lastTickMsRef.current ?? nowMs;
      const dt = Math.min(0.04, (nowMs - last) / 1000);
      lastTickMsRef.current = nowMs;

      for (const s of starsRef.current) {
        s.y += s.vy * dt;
        if (s.y > WORLD_HEIGHT + 20) {
          s.y = -10;
          s.x = Math.random() * WORLD_WIDTH;
          s.vy = 40 + Math.random() * 180;
          s.size = 0.8 + Math.random() * 2;
          s.a = 0.1 + Math.random() * 0.7;
        }
      }

      if (gameStateRef.current !== "playing") return;

      if (keysRef.current.shoot) fire(nowMs);

      spawnEnemy(nowMs);

      const p = playerRef.current;
      const nowPerf = performance.now();

      if (pointerTargetRef.current.active) {
        const tx = pointerTargetRef.current.x;
        const ty = pointerTargetRef.current.y;
        p.x += (tx - p.x) * clamp(dt * 12, 0, 1);
        p.y += (ty - p.y) * clamp(dt * 12, 0, 1);
      } else {
        const speed = 320;
        const dx = (keysRef.current.left ? -1 : 0) + (keysRef.current.right ? 1 : 0);
        const dy = (keysRef.current.up ? -1 : 0) + (keysRef.current.down ? 1 : 0);
        p.x += dx * speed * dt;
        p.y += dy * speed * dt;
      }

      p.x = clamp(p.x, p.r + 10, WORLD_WIDTH - p.r - 10);
      p.y = clamp(p.y, WORLD_HEIGHT * 0.35, WORLD_HEIGHT - p.r - 14);

      bulletsRef.current = bulletsRef.current
        .map(b => ({ ...b, y: b.y + b.vy * dt }))
        .filter(b => b.y > -30);

      enemiesRef.current = enemiesRef.current
        .map(en => ({ ...en, y: en.y + en.vy * dt }))
        .filter(en => en.y < WORLD_HEIGHT + 120);

      particlesRef.current = particlesRef.current
        .map(pt => ({ ...pt, x: pt.x + pt.vx * dt, y: pt.y + pt.vy * dt, vy: pt.vy + 240 * dt, life: pt.life - dt }))
        .filter(pt => pt.life > 0);

      const bullets = bulletsRef.current;
      const enemies = enemiesRef.current;

      const deadBullets = new Set<number>();
      const deadEnemies = new Set<number>();

      for (const b of bullets) {
        for (const en of enemies) {
          if (deadEnemies.has(en.id)) continue;
          const r = en.r + 3;
          if (dist2({ x: b.x, y: b.y }, { x: en.x, y: en.y }) <= r * r) {
            deadBullets.add(b.id);
            deadEnemies.add(en.id);
            explode(en.x, en.y, en.color);
            scoreRef.current += 10;
            setScore(scoreRef.current);
            break;
          }
        }
      }

      if (deadBullets.size) bulletsRef.current = bullets.filter(b => !deadBullets.has(b.id));
      if (deadEnemies.size) enemiesRef.current = enemies.filter(e => !deadEnemies.has(e.id));

      const invuln = nowPerf < p.invulnUntilMs;
      if (!invuln) {
        for (const en of enemiesRef.current) {
          const r = p.r + en.r - 6;
          if (dist2({ x: p.x, y: p.y }, { x: en.x, y: en.y }) <= r * r) {
            explode(p.x, p.y, "#22d3ee");
            enemiesRef.current = enemiesRef.current.filter(e => e.id !== en.id);
            const nextLives = livesRef.current - 1;
            livesRef.current = nextLives;
            setLives(nextLives);
            p.invulnUntilMs = nowPerf + 1200;
            if (nextLives <= 0) {
              setGameOver();
              return;
            }
            break;
          }
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

      const bg = ctx.createLinearGradient(0, 0, 0, WORLD_HEIGHT);
      bg.addColorStop(0, "#070717");
      bg.addColorStop(0.6, "#04040a");
      bg.addColorStop(1, "#000000");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

      ctx.fillStyle = "rgba(168,85,247,0.08)";
      ctx.beginPath();
      ctx.arc(WORLD_WIDTH * 0.2, WORLD_HEIGHT * 0.25, 110, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(34,211,238,0.07)";
      ctx.beginPath();
      ctx.arc(WORLD_WIDTH * 0.8, WORLD_HEIGHT * 0.18, 90, 0, Math.PI * 2);
      ctx.fill();

      for (const s of starsRef.current) {
        ctx.fillStyle = `rgba(255,255,255,${s.a})`;
        ctx.fillRect(s.x, s.y, s.size, s.size);
      }

      const p = playerRef.current;

      for (const en of enemiesRef.current) {
        ctx.save();
        ctx.shadowBlur = 18;
        ctx.shadowColor = en.color;
        ctx.fillStyle = en.color;
        ctx.beginPath();
        ctx.arc(en.x, en.y, en.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(en.x, en.y, en.r - 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.shadowBlur = 18;
      ctx.shadowColor = "rgba(34,211,238,0.9)";
      ctx.strokeStyle = "rgba(34,211,238,0.9)";
      ctx.lineWidth = 3;
      for (const b of bulletsRef.current) {
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x, b.y + 14);
        ctx.stroke();
      }
      ctx.restore();

      ctx.save();
      for (const pt of particlesRef.current) {
        const a = clamp(pt.life / 0.9, 0, 1);
        ctx.globalAlpha = 0.75 * a;
        ctx.fillStyle = pt.color;
        ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
      }
      ctx.restore();

      ctx.save();
      const invuln = performance.now() < p.invulnUntilMs;
      const blink = invuln && Math.floor(performance.now() / 90) % 2 === 0;
      if (!blink) {
        ctx.translate(p.x, p.y);
        ctx.shadowBlur = 24;
        ctx.shadowColor = "rgba(34,211,238,0.9)";
        ctx.fillStyle = "#0ea5e9";
        ctx.beginPath();
        ctx.moveTo(0, -p.r - 8);
        ctx.lineTo(p.r + 10, p.r + 12);
        ctx.lineTo(0, p.r + 4);
        ctx.lineTo(-p.r - 10, p.r + 12);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255,255,255,0.55)";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.fillRect(-3, -p.r - 4, 6, 12);
        ctx.fillStyle = "rgba(34,211,238,0.5)";
        ctx.fillRect(-2, -p.r - 2, 4, 8);

        ctx.shadowBlur = 20;
        ctx.shadowColor = "rgba(255,60,60,0.9)";
        ctx.fillStyle = "rgba(255,60,60,0.9)";
        ctx.fillRect(-p.r - 7, p.r + 8, 10, 4);
        ctx.fillRect(p.r - 3, p.r + 8, 10, 4);
      }
      ctx.restore();

      if (gameStateRef.current !== "playing") {
        ctx.fillStyle = "rgba(0,0,0,0.65)";
        ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      }
    };

    const loop = (nowMs: number) => {
      if (updateCanvasSize()) {
        tick(nowMs);
        draw();
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [fire, setGameOver]);

  const setHeld = useCallback((key: keyof typeof keysRef.current, value: boolean) => {
    keysRef.current[key] = value;
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4 font-orbitron text-white">
      <div className="mb-4 text-center">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-purple-400 to-pink-500 drop-shadow-[0_0_18px_rgba(34,211,238,0.25)]">
          STAR WAR
        </h1>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-zinc-200 text-sm md:text-base">
          <p>SCORE: {score}</p>
          <p>LIVES: {lives}</p>
          <p>BEST: {highScore}</p>
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          className="border border-zinc-700/70 rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.65)] touch-none w-auto h-auto max-w-[min(96vw,640px)] max-h-[70vh] aspect-[420/620] bg-black select-none"
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
          onPointerCancel={handleCanvasPointerUp}
        />

        {gameState === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm rounded-xl">
            <button
              onClick={startGame}
              className="px-10 py-4 bg-zinc-100 text-black font-black text-xl rounded-full hover:bg-white transition-all hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
              type="button"
            >
              START
            </button>
            <p className="mt-4 text-zinc-300/80 text-xs tracking-wide">
              WASD / ARROWS MOVE · SPACE SHOOT · TAP/DRAG TO MOVE + SHOOT
            </p>
          </div>
        )}

        {gameState === "gameover" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-xl">
            <h2 className="text-5xl font-black text-red-400 mb-3">GAME OVER</h2>
            <p className="text-xl text-zinc-200 mb-8">FINAL SCORE: {score}</p>
            <button
              onClick={startGame}
              className="px-10 py-4 bg-zinc-100 text-black font-black text-xl rounded-full hover:bg-white transition-all hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
              type="button"
            >
              RETRY
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2 md:hidden w-full max-w-[320px]">
        <div className="col-start-2">
          <button
            className="w-full aspect-square bg-zinc-900/60 border border-zinc-700 rounded-xl text-zinc-100 active:bg-zinc-100 active:text-black transition-colors flex items-center justify-center font-black text-xs tracking-wide"
            onPointerDown={() => setHeld("up", true)}
            onPointerUp={() => setHeld("up", false)}
            onPointerCancel={() => setHeld("up", false)}
            type="button"
          >
            UP
          </button>
        </div>
        <div className="col-start-1 row-start-2">
          <button
            className="w-full aspect-square bg-zinc-900/60 border border-zinc-700 rounded-xl text-zinc-100 active:bg-zinc-100 active:text-black transition-colors flex items-center justify-center font-black text-xs tracking-wide"
            onPointerDown={() => setHeld("left", true)}
            onPointerUp={() => setHeld("left", false)}
            onPointerCancel={() => setHeld("left", false)}
            type="button"
          >
            LEFT
          </button>
        </div>
        <div className="col-start-2 row-start-2">
          <button
            className="w-full aspect-square bg-red-950/60 border border-red-700 rounded-xl text-red-200 active:bg-red-400 active:text-black transition-colors flex items-center justify-center font-black text-xs tracking-wide"
            onPointerDown={() => setHeld("shoot", true)}
            onPointerUp={() => setHeld("shoot", false)}
            onPointerCancel={() => setHeld("shoot", false)}
            type="button"
          >
            FIRE
          </button>
        </div>
        <div className="col-start-3 row-start-2">
          <button
            className="w-full aspect-square bg-zinc-900/60 border border-zinc-700 rounded-xl text-zinc-100 active:bg-zinc-100 active:text-black transition-colors flex items-center justify-center font-black text-xs tracking-wide"
            onPointerDown={() => setHeld("right", true)}
            onPointerUp={() => setHeld("right", false)}
            onPointerCancel={() => setHeld("right", false)}
            type="button"
          >
            RIGHT
          </button>
        </div>
        <div className="col-start-2 row-start-3">
          <button
            className="w-full aspect-square bg-zinc-900/60 border border-zinc-700 rounded-xl text-zinc-100 active:bg-zinc-100 active:text-black transition-colors flex items-center justify-center font-black text-xs tracking-wide"
            onPointerDown={() => setHeld("down", true)}
            onPointerUp={() => setHeld("down", false)}
            onPointerCancel={() => setHeld("down", false)}
            type="button"
          >
            DOWN
          </button>
        </div>
      </div>

      <Link
        href="/"
        className="mt-8 text-cyan-300 hover:text-cyan-200 transition-colors flex items-center gap-2 font-press-start text-xs"
      >
        ← BACK TO ARCADE
      </Link>
    </div>
  );
};

export default StarWarGame;
