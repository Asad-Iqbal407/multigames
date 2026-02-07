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

type Shockwave = {
  id: number;
  x: number;
  y: number;
  r: number;
  maxR: number;
};

const STAGE_PALETTES = [
  ["#070717", "#04040a", "#000000"], // 1: Default Blue/Black
  ["#2e0202", "#1a0000", "#000000"], // 2: Red Nebula
  ["#1a052e", "#0a0214", "#000000"], // 3: Purple Void
  ["#022e2e", "#001414", "#000000"], // 4: Cyan Deep
];

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
  const [stage, setStage] = useState(1);
  const [highScore, setHighScore] = useState(() => {
    if (typeof window === "undefined") return 0;
    const saved = localStorage.getItem("starwar-highscore");
    const n = saved ? parseInt(saved, 10) : 0;
    return Number.isFinite(n) ? n : 0;
  });

  const gameStateRef = useRef<GameState>("idle");
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const stageRef = useRef(1);

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
  const lastBombMsRef = useRef(0);
  const lastTickMsRef = useRef<number | null>(null);

  const projectilesRef = useRef<{ id: number; x: number; y: number; vy: number; isBomb: boolean; r: number }[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);

  const keysRef = useRef({
    left: false,
    right: false,
    up: false,
    down: false,
    shoot: false,
    bomb: false
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
  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  const resetWorld = useCallback(() => {
    playerRef.current = {
      x: WORLD_WIDTH / 2,
      y: WORLD_HEIGHT - 80,
      r: 18,
      invulnUntilMs: performance.now() + 800
    };
    bulletsRef.current = [];
    projectilesRef.current = [];
    shockwavesRef.current = [];
    enemiesRef.current = [];
    particlesRef.current = [];
    scoreRef.current = 0;
    livesRef.current = 3;
    stageRef.current = 1;
    setScore(0);
    setLives(3);
    setStage(1);
    lastEnemySpawnMsRef.current = performance.now();
    lastShotMsRef.current = 0;
    lastBombMsRef.current = 0;
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

  const fire = useCallback((nowMs: number, isBomb: boolean = false) => {
    if (gameStateRef.current !== "playing") return;
    
    if (isBomb) {
      const bombCooldown = 2000;
      if (nowMs - lastBombMsRef.current < bombCooldown) return;
      lastBombMsRef.current = nowMs;

      const id = nextIdRef.current++;
      const p = playerRef.current;
      projectilesRef.current.push({
        id,
        x: p.x,
        y: p.y - 20,
        vy: -300,
        isBomb: true,
        r: 12
      });
      return;
    }

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
      if (e.key === "f" || e.key === "F") keysRef.current.bomb = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keysRef.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keysRef.current.right = false;
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") keysRef.current.up = false;
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") keysRef.current.down = false;
      if (e.key === " " || e.key === "Spacebar") keysRef.current.shoot = false;
      if (e.key === "f" || e.key === "F") keysRef.current.bomb = false;
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
      const maxEnemies = 7 + stageRef.current * 2;
      if (enemiesInView >= maxEnemies) return;

      const baseEvery = Math.max(250, 920 - scoreRef.current * 3 - stageRef.current * 100);
      if (nowMs - lastEnemySpawnMsRef.current < baseEvery) return;
      lastEnemySpawnMsRef.current = nowMs;

      const id = nextIdRef.current++;
      const r = 16 + Math.random() * 12;
      const x = r + Math.random() * (WORLD_WIDTH - r * 2);
      const y = -r - 20;
      const vy = 90 + Math.random() * 150 + Math.min(220, scoreRef.current * 0.6) + stageRef.current * 20;
      const palette = ["#ff3b3b", "#ff7a18", "#ff2fd6", "#a855f7"];
      const color = palette[Math.floor(Math.random() * palette.length)];

      enemiesRef.current = [
        ...enemiesRef.current,
        { id, x, y, vy, r, hp: 1 + Math.floor(stageRef.current / 3), color }
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
      if (keysRef.current.bomb) fire(nowMs, true);

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

      projectilesRef.current = projectilesRef.current
        .map(p => ({ ...p, y: p.y + p.vy * dt }))
        .filter(p => p.y > -50);

      shockwavesRef.current = shockwavesRef.current
        .map(s => ({ ...s, r: s.r + (s.maxR - s.r) * 0.1 }))
        .filter(s => s.r < s.maxR - 2);

      enemiesRef.current = enemiesRef.current
        .map(en => ({ ...en, y: en.y + en.vy * dt }))
        .filter(en => en.y < WORLD_HEIGHT + 120);

      particlesRef.current = particlesRef.current
        .map(pt => ({ ...pt, x: pt.x + pt.vx * dt, y: pt.y + pt.vy * dt, vy: pt.vy + 240 * dt, life: pt.life - dt }))
        .filter(pt => pt.life > 0);

      const bullets = bulletsRef.current;
      const projectiles = projectilesRef.current;
      const enemies = enemiesRef.current;
      const shockwaves = shockwavesRef.current;

      const deadBullets = new Set<number>();
      const deadProjectiles = new Set<number>();
      const deadEnemies = new Set<number>();

      // Bullet vs Enemy
      for (const b of bullets) {
        for (const en of enemies) {
          if (deadEnemies.has(en.id)) continue;
          const r = en.r + 3;
          if (dist2({ x: b.x, y: b.y }, { x: en.x, y: en.y }) <= r * r) {
            deadBullets.add(b.id);
            en.hp -= 1;
            if (en.hp <= 0) {
              deadEnemies.add(en.id);
              explode(en.x, en.y, en.color);
              scoreRef.current += 10;
              setScore(scoreRef.current);
            }
            break;
          }
        }
      }

      // Projectile (Bomb) vs Enemy
      for (const p of projectiles) {
        for (const en of enemies) {
          if (deadEnemies.has(en.id)) continue;
          const r = en.r + p.r;
          if (dist2({ x: p.x, y: p.y }, { x: en.x, y: en.y }) <= r * r) {
            deadProjectiles.add(p.id);
            // Create shockwave
            shockwavesRef.current.push({
              id: nextIdRef.current++,
              x: p.x,
              y: p.y,
              r: 10,
              maxR: 120
            });
            explode(p.x, p.y, "#ff7a18");
            break;
          }
        }
      }

      // Shockwave vs Enemy
      for (const s of shockwaves) {
        for (const en of enemies) {
          if (deadEnemies.has(en.id)) continue;
          const d2 = dist2({ x: s.x, y: s.y }, { x: en.x, y: en.y });
          const combinedR = s.r + en.r;
          if (d2 <= combinedR * combinedR) {
            deadEnemies.add(en.id);
            explode(en.x, en.y, en.color);
            scoreRef.current += 15;
            setScore(scoreRef.current);
          }
        }
      }

      if (deadBullets.size) bulletsRef.current = bullets.filter(b => !deadBullets.has(b.id));
      if (deadProjectiles.size) projectilesRef.current = projectiles.filter(p => !deadProjectiles.has(p.id));
      if (deadEnemies.size) enemiesRef.current = enemies.filter(e => !deadEnemies.has(e.id));

      // Stage Progression
      const nextStageThreshold = stageRef.current * 500;
      if (scoreRef.current >= nextStageThreshold) {
        stageRef.current += 1;
        setStage(stageRef.current);
        // Bonus for stage clear
        const bonus = 100 * stageRef.current;
        scoreRef.current += bonus;
        setScore(scoreRef.current);
        // Temporary invulnerability on stage clear
        playerRef.current.invulnUntilMs = performance.now() + 1500;
      }

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
      const palette = STAGE_PALETTES[(stageRef.current - 1) % STAGE_PALETTES.length];
      bg.addColorStop(0, palette[0]);
      bg.addColorStop(0.6, palette[1]);
      bg.addColorStop(1, palette[2]);
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

      // Draw Bombs
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = "#ff7a18";
      ctx.fillStyle = "#ff7a18";
      for (const p of projectilesRef.current) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();

      // Draw Shockwaves
      ctx.save();
      for (const s of shockwavesRef.current) {
        const opacity = 1 - (s.r / s.maxR);
        ctx.strokeStyle = `rgba(255, 122, 24, ${opacity})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.2})`;
        ctx.fill();
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] p-4 font-orbitron text-white overflow-hidden">
      {/* Decorative Arcade Header */}
      <div className="mb-8 text-center animate-pulse">
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 via-purple-500 to-pink-600 filter drop-shadow-[0_0_20px_rgba(168,85,247,0.4)]">
          STAR WAR
        </h1>
        <div className="mt-4 flex items-center justify-center gap-6">
          <div className="h-[2px] w-12 bg-gradient-to-r from-transparent to-cyan-500" />
          <span className="text-[10px] font-press-start tracking-[0.2em] text-cyan-400/80 uppercase">Elite Squadron</span>
          <div className="h-[2px] w-12 bg-gradient-to-l from-transparent to-pink-500" />
        </div>
      </div>

      <div className="relative group">
        {/* Arcade Cabinet Frame */}
        <div className="absolute -inset-4 bg-gradient-to-b from-zinc-800 to-zinc-950 rounded-[2rem] border-2 border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(255,255,255,0.05)]" />
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-[1.5rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
        
        {/* Game Stats Bar */}
        <div className="absolute -top-12 left-4 right-4 flex justify-between items-end px-2">
          <div className="flex flex-col">
            <span className="text-[8px] font-press-start text-zinc-500 mb-1">CURRENT STAGE</span>
            <span className="text-xl font-black text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">0{stage}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[8px] font-press-start text-zinc-500 mb-1">SCORE</span>
            <span className="text-2xl font-black text-white tabular-nums">{score.toLocaleString()}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-press-start text-zinc-500 mb-1">HI-SCORE</span>
            <span className="text-xl font-black text-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]">{highScore.toLocaleString()}</span>
          </div>
        </div>

        <div className="relative z-10 p-1 bg-zinc-900 rounded-2xl shadow-inner border border-white/10">
          <canvas
            ref={canvasRef}
            className="rounded-xl shadow-2xl touch-none w-auto h-auto max-w-[min(96vw,420px)] max-h-[70vh] aspect-[420/620] bg-black select-none"
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
            onPointerCancel={handleCanvasPointerUp}
          />

          {/* Lives Display inside the frame */}
          <div className="absolute bottom-4 left-4 flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div 
                key={i} 
                className={`w-3 h-3 rounded-full border ${i < lives ? 'bg-cyan-400 border-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-transparent border-zinc-700'}`}
              />
            ))}
          </div>
        </div>

        {/* Overlays */}
        {gameState === "idle" && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md rounded-2xl border border-white/5">
            <div className="mb-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center animate-bounce">
                <span className="text-4xl">🚀</span>
              </div>
              <h2 className="text-3xl font-black text-white mb-2 tracking-widest">READY PILOT?</h2>
              <p className="text-cyan-400/60 text-[10px] font-press-start">MISSION: SECTOR {stage}</p>
            </div>

            <div className="flex flex-col gap-4 w-full max-w-[240px]">
              <button
                onClick={startGame}
                className="group relative px-8 py-4 bg-white text-black font-black text-xl rounded-xl overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                type="button"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                LAUNCH
              </button>
              
              <Link
                href="/"
                className="px-8 py-3 bg-zinc-900 border border-white/10 text-zinc-400 font-bold text-sm rounded-xl hover:bg-zinc-800 hover:text-white transition-all text-center flex items-center justify-center gap-2"
              >
                <span>🏠</span> EXIT TO HOME
              </Link>
            </div>

            <div className="absolute bottom-10 left-0 right-0 text-center">
              <p className="text-[8px] font-press-start text-zinc-500 leading-relaxed uppercase tracking-tighter">
                WASD TO MOVE • SPACE TO FIRE • F FOR BOMB
              </p>
            </div>
          </div>
        )}

        {gameState === "gameover" && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl rounded-2xl border border-red-500/20">
            <div className="mb-8 text-center">
              <div className="text-6xl mb-4 animate-bounce">💥</div>
              <h2 className="text-5xl font-black text-red-500 mb-2 tracking-tighter drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">MISSION FAILED</h2>
              <div className="flex items-center justify-center gap-4 mt-4">
                <div className="px-3 py-1 bg-zinc-900 rounded-lg border border-white/5">
                  <span className="text-[8px] font-press-start text-zinc-500 block mb-1">SCORE</span>
                  <span className="text-xl font-black text-white">{score}</span>
                </div>
                <div className="px-3 py-1 bg-zinc-900 rounded-lg border border-white/5">
                  <span className="text-[8px] font-press-start text-zinc-500 block mb-1">BEST</span>
                  <span className="text-xl font-black text-pink-500">{highScore}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 w-full max-w-[240px]">
              <button
                onClick={startGame}
                className="group relative px-8 py-4 bg-red-600 text-white font-black text-xl rounded-xl overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(220,38,38,0.4)]"
                type="button"
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
                REDEPLOY
              </button>
              
              <Link
                href="/"
                className="px-8 py-3 bg-zinc-900 border border-white/10 text-zinc-400 font-bold text-sm rounded-xl hover:bg-zinc-800 hover:text-white transition-all text-center flex items-center justify-center gap-2"
              >
                <span>🏠</span> EXIT TO HOME
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Controls Enhancement */}
      <div className="mt-12 grid grid-cols-4 gap-3 md:hidden w-full max-w-[420px] px-4">
        <div className="col-start-2">
          <ControlButton label="UP" onDown={() => setHeld("up", true)} onUp={() => setHeld("up", false)} color="zinc" />
        </div>
        <div className="col-start-1 row-start-2">
          <ControlButton label="LEFT" onDown={() => setHeld("left", true)} onUp={() => setHeld("left", false)} color="zinc" />
        </div>
        <div className="col-start-2 row-start-2">
          <ControlButton label="FIRE" onDown={() => setHeld("shoot", true)} onUp={() => setHeld("shoot", false)} color="red" />
        </div>
        <div className="col-start-3 row-start-2">
          <ControlButton label="RIGHT" onDown={() => setHeld("right", true)} onUp={() => setHeld("right", false)} color="zinc" />
        </div>
        <div className="col-start-4 row-start-2">
          <ControlButton label="BOMB" onDown={() => setHeld("bomb", true)} onUp={() => setHeld("bomb", false)} color="orange" />
        </div>
        <div className="col-start-2 row-start-3">
          <ControlButton label="DOWN" onDown={() => setHeld("down", true)} onUp={() => setHeld("down", false)} color="zinc" />
        </div>
      </div>
    </div>
  );
};

const ControlButton: React.FC<{ label: string; onDown: () => void; onUp: () => void; color: 'zinc' | 'red' | 'orange' }> = ({ label, onDown, onUp, color }) => {
  const colors = {
    zinc: "bg-zinc-800/80 border-zinc-700 text-zinc-400 active:bg-zinc-100 active:text-black",
    red: "bg-red-900/60 border-red-700 text-red-400 active:bg-red-500 active:text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]",
    orange: "bg-orange-900/60 border-orange-700 text-orange-400 active:bg-orange-500 active:text-white shadow-[0_0_15px_rgba(249,115,22,0.3)]"
  };

  return (
    <button
      className={`w-full aspect-square border-2 rounded-2xl transition-all flex items-center justify-center font-black text-[10px] tracking-widest uppercase ${colors[color]}`}
      onPointerDown={onDown}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      type="button"
    >
      {label}
    </button>
  );
};

export default StarWarGame;
