"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

type GameState = "idle" | "playing" | "stage" | "win" | "lose";
type WeaponType = "laser" | "missile" | "bomb";

type Player = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  weapon: WeaponType;
  holdUntil: number;
  holdType: WeaponType;
  droneUntil: number;
  droneCooldownUntil: number;
  lastShotMs: number;
  lastMissileMs: number;
  lastBombMs: number;
  lastDroneShotMs: number;
};

type Enemy = {
  x: number;
  y: number;
  r: number;
  hp: number;
  maxHp: number;
  nextFireMs: number;
  nextBombMs: number;
  nextRocketMs: number;
  flameUntilMs: number;
  bobPhase: number;
};

type Projectile = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  damage: number;
  owner: "player" | "enemy";
  kind: "laser" | "missile" | "bomb" | "fireball" | "lava" | "rocket" | "drone";
  ttl: number;
};

type Explosion = {
  id: number;
  x: number;
  y: number;
  r: number;
  maxR: number;
  damage: number;
  owner: "player" | "enemy";
  life: number;
};

type Ember = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
};

const WORLD_WIDTH = 920;
const WORLD_HEIGHT = 520;
const GROUND_Y = 430;
const GRAVITY = 720;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const STAGES = [
  {
    name: "NEON CITY",
    enemyMaxHp: 600,
    playerMaxHp: 340,
    fireCooldown: 1000,
    bombCooldown: 2600,
    rocketCooldown: 2000,
    flameChance: 0.45,
    enemyDamage: 0.9,
    skyTop: "#05070f",
    skyMid: "#0c1020",
    skyBottom: "#111827",
    glow: "rgba(56,189,248,0.22)",
    groundTop: "#0f172a",
    groundBottom: "#020617",
    skyline: "#0b0f1a"
  },
  {
    name: "STORM FRONT",
    enemyMaxHp: 720,
    playerMaxHp: 370,
    fireCooldown: 900,
    bombCooldown: 2300,
    rocketCooldown: 1800,
    flameChance: 0.5,
    enemyDamage: 1,
    skyTop: "#0a0f1f",
    skyMid: "#13203a",
    skyBottom: "#10152a",
    glow: "rgba(129,140,248,0.2)",
    groundTop: "#111827",
    groundBottom: "#020617",
    skyline: "#111827"
  },
  {
    name: "EMBER RIDGE",
    enemyMaxHp: 840,
    playerMaxHp: 390,
    fireCooldown: 820,
    bombCooldown: 2100,
    rocketCooldown: 1650,
    flameChance: 0.56,
    enemyDamage: 1.08,
    skyTop: "#1b0b0b",
    skyMid: "#2b0f12",
    skyBottom: "#12090b",
    glow: "rgba(251,113,133,0.22)",
    groundTop: "#2b0f12",
    groundBottom: "#0f0a0a",
    skyline: "#1f0a0a"
  },
  {
    name: "ION CHASM",
    enemyMaxHp: 1000,
    playerMaxHp: 410,
    fireCooldown: 740,
    bombCooldown: 1900,
    rocketCooldown: 1500,
    flameChance: 0.62,
    enemyDamage: 1.16,
    skyTop: "#04121f",
    skyMid: "#092239",
    skyBottom: "#04121f",
    glow: "rgba(34,211,238,0.2)",
    groundTop: "#062130",
    groundBottom: "#020617",
    skyline: "#041521"
  },
  {
    name: "DINO CORE",
    enemyMaxHp: 1240,
    playerMaxHp: 440,
    fireCooldown: 680,
    bombCooldown: 1700,
    rocketCooldown: 1350,
    flameChance: 0.7,
    enemyDamage: 1.3,
    skyTop: "#120814",
    skyMid: "#230a2a",
    skyBottom: "#0b0611",
    glow: "rgba(244,114,182,0.2)",
    groundTop: "#2a0f2f",
    groundBottom: "#120816",
    skyline: "#1a0b1f"
  }
];

const WEAPON_STATS: Record<WeaponType, { cooldown: number; damage: number; speed: number; ttl: number; size: number }> = {
  laser: { cooldown: 220, damage: 3, speed: 720, ttl: 1.1, size: 3 },
  missile: { cooldown: 880, damage: 9, speed: 380, ttl: 1.9, size: 6 },
  bomb: { cooldown: 1300, damage: 14, speed: 300, ttl: 2.6, size: 9 }
};

const SupermanDinoGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nextIdRef = useRef(1);
  const lastTickRef = useRef<number | null>(null);
  const hpHistoryRef = useRef<{ t: number; p: number; e: number }[]>([]);
  const viewRef = useRef({ scale: 1, offsetX: 0, offsetY: 0, cssW: WORLD_WIDTH, cssH: WORLD_HEIGHT, dpr: 1 });

  const [gameState, setGameState] = useState<GameState>("idle");
  const [playerHp, setPlayerHp] = useState(STAGES[0].playerMaxHp);
  const [enemyHp, setEnemyHp] = useState(STAGES[0].enemyMaxHp);
  const [weapon, setWeapon] = useState<WeaponType>("laser");
  const [score, setScore] = useState(0);
  const [stage, setStage] = useState(1);

  const gameStateRef = useRef<GameState>("idle");
  const playerHpRef = useRef(STAGES[0].playerMaxHp);
  const enemyHpRef = useRef(STAGES[0].enemyMaxHp);
  const scoreRef = useRef(0);
  const stageRef = useRef(1);

  const keysRef = useRef({
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    fire: false,
    swapNext: false,
    swapPrev: false,
    drone: false
  });

  const pointerRef = useRef<{ active: boolean; x: number; y: number }>({
    active: false,
    x: WORLD_WIDTH * 0.2,
    y: WORLD_HEIGHT * 0.6
  });

  const playerRef = useRef<Player>({
    x: WORLD_WIDTH * 0.2,
    y: GROUND_Y - 40,
    vx: 0,
    vy: 0,
    r: 20,
    weapon: "laser",
    holdUntil: 0,
    holdType: "laser",
    droneUntil: 0,
    droneCooldownUntil: 0,
    lastShotMs: 0,
    lastMissileMs: 0,
    lastBombMs: 0,
    lastDroneShotMs: 0
  });

  const enemyRef = useRef<Enemy>({
    x: WORLD_WIDTH - 130,
    y: GROUND_Y - 70,
    r: 60,
    hp: STAGES[0].enemyMaxHp,
    maxHp: STAGES[0].enemyMaxHp,
    nextFireMs: 0,
    nextBombMs: 0,
    nextRocketMs: 0,
    flameUntilMs: 0,
    bobPhase: 0
  });

  const projectilesRef = useRef<Projectile[]>([]);
  const explosionsRef = useRef<Explosion[]>([]);
  const embersRef = useRef<Ember[]>([]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);
  useEffect(() => {
    playerHpRef.current = playerHp;
  }, [playerHp]);
  useEffect(() => {
    enemyHpRef.current = enemyHp;
  }, [enemyHp]);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);
  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);
  useEffect(() => {
    playerRef.current.weapon = weapon;
  }, [weapon]);

  const startStage = useCallback((stageNumber: number, keepScore: boolean) => {
    const index = clamp(stageNumber - 1, 0, STAGES.length - 1);
    const cfg = STAGES[index];
    stageRef.current = stageNumber;
    setStage(stageNumber);
    playerRef.current = {
      x: WORLD_WIDTH * 0.2,
      y: GROUND_Y - 40,
      vx: 0,
      vy: 0,
      r: 20,
      weapon: playerRef.current.weapon,
      holdUntil: 0,
      holdType: playerRef.current.weapon,
      droneUntil: 0,
      droneCooldownUntil: 0,
      lastShotMs: 0,
      lastMissileMs: 0,
      lastBombMs: 0,
      lastDroneShotMs: 0
    };
    enemyRef.current = {
      x: WORLD_WIDTH - 130,
      y: GROUND_Y - 70,
      r: 60,
      hp: cfg.enemyMaxHp,
      maxHp: cfg.enemyMaxHp,
      nextFireMs: 0,
      nextBombMs: 0,
      nextRocketMs: 0,
      flameUntilMs: 0,
      bobPhase: Math.random() * Math.PI * 2
    };
    projectilesRef.current = [];
    explosionsRef.current = [];
    embersRef.current = [];
    hpHistoryRef.current = [];
    if (!keepScore) {
      scoreRef.current = 0;
      setScore(0);
    }
    playerHpRef.current = cfg.playerMaxHp;
    enemyHpRef.current = cfg.enemyMaxHp;
    setPlayerHp(cfg.playerMaxHp);
    setEnemyHp(cfg.enemyMaxHp);
    setGameState("playing");
    lastTickRef.current = null;
  }, []);

  const startGame = useCallback(() => {
    startStage(1, false);
  }, [startStage]);

  const screenToWorld = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 };
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 };
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    const v = viewRef.current;
    const x = (localX - v.offsetX) / v.scale;
    const y = (localY - v.offsetY) / v.scale;
    return { x: clamp(x, 0, WORLD_WIDTH), y: clamp(y, 0, WORLD_HEIGHT) };
  }, []);

  const addExplosion = useCallback((x: number, y: number, maxR: number, damage: number, owner: "player" | "enemy") => {
    explosionsRef.current.push({
      id: nextIdRef.current++,
      x,
      y,
      r: 10,
      maxR,
      damage,
      owner,
      life: 0.4
    });
  }, []);

  const emitEmbers = useCallback((x: number, y: number, color: string) => {
    for (let i = 0; i < 6; i++) {
      embersRef.current.push({
        id: nextIdRef.current++,
        x,
        y,
        vx: (Math.random() - 0.5) * 300,
        vy: (Math.random() - 0.5) * 300,
        life: 0.6 + Math.random() * 0.4,
        color,
        size: 2 + Math.random() * 3
      });
    }
  }, []);

  const fireWeapon = useCallback((nowMs: number, type: WeaponType, isDrone = false) => {
    const p = playerRef.current;
    const stats = WEAPON_STATS[type];
    
    // Cooldown check
    if (!isDrone) {
      if (type === "laser" && nowMs - p.lastShotMs < stats.cooldown) return;
      if (type === "missile" && nowMs - p.lastMissileMs < stats.cooldown) return;
      if (type === "bomb" && nowMs - p.lastBombMs < stats.cooldown) return;
    } else {
      if (nowMs - p.lastDroneShotMs < 120) return;
    }

    // Update cooldowns
    if (!isDrone) {
      if (type === "laser") p.lastShotMs = nowMs;
      if (type === "missile") p.lastMissileMs = nowMs;
      if (type === "bomb") p.lastBombMs = nowMs;
    } else {
      p.lastDroneShotMs = nowMs;
    }

    // Visuals
    p.holdUntil = nowMs + 200;
    p.holdType = type;

    // Create projectile
    const vx = type === "bomb" ? 400 : stats.speed;
    const vy = type === "bomb" ? -350 : 0;
    
    projectilesRef.current.push({
      id: nextIdRef.current++,
      x: p.x + (isDrone ? 40 : 20),
      y: p.y - (isDrone ? 50 : 20),
      vx,
      vy,
      r: stats.size,
      damage: stats.damage,
      owner: "player",
      kind: isDrone ? "drone" : type,
      ttl: stats.ttl
    });
  }, []);

  const spawnEnemyAttack = useCallback((nowMs: number) => {
    const en = enemyRef.current;
    const cfg = STAGES[clamp(stageRef.current - 1, 0, STAGES.length - 1)];

    if (nowMs > en.nextFireMs) {
      en.nextFireMs = nowMs + cfg.fireCooldown + Math.random() * 500;
      projectilesRef.current.push({
        id: nextIdRef.current++,
        x: en.x - 40,
        y: en.y - 40,
        vx: -350,
        vy: (Math.random() - 0.5) * 100,
        r: 6,
        damage: 4 * cfg.enemyDamage,
        owner: "enemy",
        kind: "fireball",
        ttl: 2
      });
    }
    if (nowMs > en.nextBombMs) {
      en.nextBombMs = nowMs + cfg.bombCooldown + Math.random() * 600;
      projectilesRef.current.push({
        id: nextIdRef.current++,
        x: en.x - 20,
        y: en.y - 80,
        vx: -300 - Math.random() * 100,
        vy: -400,
        r: 10,
        damage: 8 * cfg.enemyDamage,
        owner: "enemy",
        kind: "lava",
        ttl: 3
      });
    }
    if (nowMs > en.nextRocketMs) {
      en.nextRocketMs = nowMs + cfg.rocketCooldown + Math.random() * 700;
      const ang = Math.atan2(playerRef.current.y - en.y, playerRef.current.x - en.x);
      const speed = 310;
      projectilesRef.current.push({
        id: nextIdRef.current++,
        x: en.x - 20,
        y: en.y - 80,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        r: 8,
        damage: 5 * cfg.enemyDamage,
        owner: "enemy",
        kind: "rocket",
        ttl: 2.2
      });
    }
    const flameReady = nowMs > en.flameUntilMs && Math.random() > 1 - cfg.flameChance;
    if (flameReady) {
      en.flameUntilMs = nowMs + 900;
    }
  }, []);

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      const { x, y } = screenToWorld(e.clientX, e.clientY);
      pointerRef.current = { active: true, x, y };
      
      // Control Logic for touch
      if (x < WORLD_WIDTH * 0.3) {
        if (y < WORLD_HEIGHT * 0.5) {
          keysRef.current.jump = true;
          setTimeout(() => keysRef.current.jump = false, 200);
        } else {
          // Left/Right logic could go here
        }
      } else {
        keysRef.current.fire = true;
      }
    };
    const handlePointerMove = (e: PointerEvent) => {
      if (!pointerRef.current.active) return;
      const { x, y } = screenToWorld(e.clientX, e.clientY);
      pointerRef.current.x = x;
      pointerRef.current.y = y;
    };
    const handlePointerUp = () => {
      pointerRef.current.active = false;
      keysRef.current.fire = false;
      keysRef.current.jump = false;
    };
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointercancel", handlePointerUp);
    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [screenToWorld, startGame]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case "ArrowLeft": case "KeyA": keysRef.current.left = true; break;
        case "ArrowRight": case "KeyD": keysRef.current.right = true; break;
        case "ArrowUp": case "KeyW": case "Space": keysRef.current.up = true; keysRef.current.jump = true; break;
        case "ArrowDown": case "KeyS": keysRef.current.down = true; break;
        case "KeyJ": keysRef.current.fire = true; break;
        case "KeyQ": keysRef.current.swapPrev = true; break;
        case "KeyE": keysRef.current.swapNext = true; break;
        case "KeyR": keysRef.current.drone = true; break;
        case "Digit1": playerRef.current.weapon = "laser"; setWeapon("laser"); break;
        case "Digit2": playerRef.current.weapon = "missile"; setWeapon("missile"); break;
        case "Digit3": playerRef.current.weapon = "bomb"; setWeapon("bomb"); break;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case "ArrowLeft": case "KeyA": keysRef.current.left = false; break;
        case "ArrowRight": case "KeyD": keysRef.current.right = false; break;
        case "ArrowUp": case "KeyW": case "Space": keysRef.current.up = false; keysRef.current.jump = false; break;
        case "ArrowDown": case "KeyS": keysRef.current.down = false; break;
        case "KeyJ": keysRef.current.fire = false; break;
        case "KeyR": keysRef.current.drone = false; break;
      }
    };
    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown as EventListener);
      window.removeEventListener("keyup", onKeyUp as EventListener);
    };
  }, [addExplosion, emitEmbers, fireWeapon, spawnEnemyAttack, startGame, startStage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;

    const syncCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const cssW = Math.max(1, rect.width);
      const cssH = Math.max(1, rect.height);
      const dpr = window.devicePixelRatio || 1;
      const nextW = Math.max(1, Math.floor(cssW * dpr));
      const nextH = Math.max(1, Math.floor(cssH * dpr));
      if (canvas.width !== nextW) canvas.width = nextW;
      if (canvas.height !== nextH) canvas.height = nextH;
      const scale = Math.min(cssW / WORLD_WIDTH, cssH / WORLD_HEIGHT);
      viewRef.current = {
        scale,
        offsetX: (cssW - WORLD_WIDTH * scale) / 2,
        offsetY: (cssH - WORLD_HEIGHT * scale) / 2,
        cssW,
        cssH,
        dpr
      };
    };

    syncCanvasSize();
    const onResize = () => syncCanvasSize();
    window.addEventListener("resize", onResize);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(onResize) : null;
    if (ro) ro.observe(canvas);

    const drawBackground = (stageIdx: number) => {
      const cfg = STAGES[clamp(stageIdx, 0, STAGES.length - 1)];
      
      // Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, WORLD_HEIGHT);
      skyGrad.addColorStop(0, cfg.skyTop);
      skyGrad.addColorStop(0.5, cfg.skyMid);
      skyGrad.addColorStop(1, cfg.skyBottom);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

      // Skyline
      ctx.fillStyle = cfg.skyline;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      for (let i = 0; i <= WORLD_WIDTH; i += 40) {
        const h = 20 + Math.sin(i * 0.05 + stageIdx) * 20 + Math.cos(i * 0.02) * 10;
        ctx.lineTo(i, GROUND_Y - h);
      }
      ctx.lineTo(WORLD_WIDTH, GROUND_Y);
      ctx.fill();

      // Ground
      const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, WORLD_HEIGHT);
      groundGrad.addColorStop(0, cfg.groundTop);
      groundGrad.addColorStop(1, cfg.groundBottom);
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, WORLD_HEIGHT - GROUND_Y);

      // Glow
      ctx.fillStyle = cfg.glow;
      ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    };

    const drawPowerGraph = () => {
        const hist = hpHistoryRef.current;
        if (hist.length < 2) return;
        
        const w = 240;
        const h = 60;
        const x = (WORLD_WIDTH - w) / 2;
        const y = WORLD_HEIGHT - 70;
        
        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.roundRect(x, y, w, h, 8);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.stroke();

        ctx.font = "8px sans-serif";
        ctx.fillStyle = "#aaa";
        ctx.fillText("POWER DRAW", x + 5, y + 10);
        
        const stg = STAGES[clamp(stageRef.current - 1, 0, STAGES.length - 1)];

        // Player (Blue)
        ctx.beginPath();
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 2;
        hist.forEach((pt, i) => {
            const px = x + (i / (hist.length - 1)) * w;
            const py = y + h - (pt.p / stg.playerMaxHp) * (h - 15) - 5;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        });
        ctx.stroke();

        // Enemy (Red)
        ctx.beginPath();
        ctx.strokeStyle = "#ef4444";
        hist.forEach((pt, i) => {
            const px = x + (i / (hist.length - 1)) * w;
            const py = y + h - (pt.e / stg.enemyMaxHp) * (h - 15) - 5;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        });
        ctx.stroke();
        ctx.restore();
    };

    const tick = (nowMs: number) => {
      const last = lastTickRef.current ?? nowMs;
      const dt = Math.min(0.04, (nowMs - last) / 1000);
      lastTickRef.current = nowMs;

      // Update Power Graph History
      if (nowMs % 200 < 50) {
          hpHistoryRef.current.push({ t: nowMs, p: playerHpRef.current, e: enemyHpRef.current });
          if (hpHistoryRef.current.length > 100) hpHistoryRef.current.shift();
      }

      const p = playerRef.current;
      const en = enemyRef.current;

      if (gameStateRef.current !== "playing") return;

      if (keysRef.current.swapNext || keysRef.current.swapPrev) {
        const list: WeaponType[] = ["laser", "missile", "bomb"];
        const idx = list.indexOf(p.weapon);
        const nextIdx = keysRef.current.swapNext ? (idx + 1) % list.length : (idx - 1 + list.length) % list.length;
        p.weapon = list[nextIdx];
        setWeapon(p.weapon);
        keysRef.current.swapNext = false;
        keysRef.current.swapPrev = false;
      }

      if (keysRef.current.fire) {
        fireWeapon(nowMs, p.weapon);
      }

      if (keysRef.current.drone && nowMs > p.droneCooldownUntil) {
        p.droneUntil = nowMs + 6500;
        p.droneCooldownUntil = nowMs + 12000;
      }

      const speed = 240;
      const verticalSpeed = 210;
      const hor = (keysRef.current.left ? -1 : 0) + (keysRef.current.right ? 1 : 0);
      const ver = (keysRef.current.up ? -1 : 0) + (keysRef.current.down ? 1 : 0);
      p.vx = hor * speed;
      if (ver !== 0) {
        p.vy = ver * verticalSpeed;
      } else {
        p.vy += GRAVITY * dt;
      }

      const onGround = p.y >= GROUND_Y - p.r;
      if (keysRef.current.jump && onGround) {
        p.vy = -360;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      const margin = 5;
      p.x = clamp(p.x, p.r + margin, WORLD_WIDTH - p.r - margin);
      
      if (p.y > GROUND_Y - p.r) {
        p.y = GROUND_Y - p.r;
        p.vy = 0;
      }
      
      p.y = clamp(p.y, p.r + margin, GROUND_Y - p.r);

      en.bobPhase += dt * 0.8;
      en.y = GROUND_Y - 70 + Math.sin(en.bobPhase) * 10;

      spawnEnemyAttack(nowMs);

      if (en.flameUntilMs > nowMs) {
        const flameX = en.x - 120;
        const inRange = p.x > flameX - 120 && p.x < en.x && Math.abs(p.y - (en.y - 20)) < 70;
        if (inRange) {
          const dmg = 14 * dt;
          playerHpRef.current = Math.max(0, playerHpRef.current - dmg);
          setPlayerHp(playerHpRef.current);
        }
        if (Math.random() > 0.6) {
          emitEmbers(en.x - 110 + Math.random() * 80, en.y - 40 + Math.random() * 60, "#f97316");
        }
      }

      if (p.droneUntil > nowMs) {
        fireWeapon(nowMs, "laser", true);
      }

      projectilesRef.current = projectilesRef.current
        .map((proj) => {
          const next = { ...proj };
          next.x += next.vx * dt;
          next.y += next.vy * dt;
          if (proj.kind === "bomb" || proj.kind === "lava") {
            next.vy += GRAVITY * dt * 0.8;
          }
          next.ttl -= dt;
          return next;
        })
        .filter((proj) => proj.ttl > 0 && proj.x > -80 && proj.x < WORLD_WIDTH + 80 && proj.y > -120 && proj.y < WORLD_HEIGHT + 120);

      const newProjectiles: Projectile[] = [];
      for (const proj of projectilesRef.current) {
        let exploded = false;
        
        if (proj.x <= 5 || proj.x >= WORLD_WIDTH - 5 || proj.y <= 5) {
          if (proj.kind === "missile") addExplosion(proj.x, proj.y, 70, 6, "player");
          if (proj.kind === "bomb") addExplosion(proj.x, proj.y, 90, 9, "player");
          if (proj.kind === "lava") addExplosion(proj.x, proj.y, 80, 7, "enemy");
          if (proj.kind === "rocket") addExplosion(proj.x, proj.y, 60, 5, "enemy");
          exploded = true;
        }

        if (!exploded && proj.owner === "player") {
          const dx = proj.x - en.x;
          const dy = proj.y - en.y;
          const hit = dx * dx + dy * dy <= (proj.r + en.r - 10) ** 2;
          if (hit) {
            enemyHpRef.current = Math.max(0, enemyHpRef.current - proj.damage);
            setEnemyHp(enemyHpRef.current);
            scoreRef.current += proj.damage * 4;
            setScore(scoreRef.current);
            emitEmbers(proj.x, proj.y, "#38bdf8");
            if (proj.kind === "missile") addExplosion(proj.x, proj.y, 70, 6, "player");
            if (proj.kind === "bomb") addExplosion(proj.x, proj.y, 90, 9, "player");
            exploded = proj.kind !== "laser" && proj.kind !== "drone";
          }
        } else {
          const dx = proj.x - p.x;
          const dy = proj.y - p.y;
          const hit = dx * dx + dy * dy <= (proj.r + p.r - 6) ** 2;
          if (hit) {
            playerHpRef.current = Math.max(0, playerHpRef.current - proj.damage);
            setPlayerHp(playerHpRef.current);
            emitEmbers(proj.x, proj.y, "#f43f5e");
            if (proj.kind === "lava") addExplosion(proj.x, proj.y, 80, 7, "enemy");
            if (proj.kind === "rocket") addExplosion(proj.x, proj.y, 60, 5, "enemy");
            exploded = proj.kind !== "fireball";
          }
        }
        if (proj.kind === "bomb" && proj.y >= GROUND_Y - 6) {
          addExplosion(proj.x, GROUND_Y - 8, 90, 9, "player");
          exploded = true;
        }
        if (proj.kind === "lava" && proj.y >= GROUND_Y - 6) {
          addExplosion(proj.x, GROUND_Y - 8, 80, 7, "enemy");
          exploded = true;
        }
        if (!exploded) newProjectiles.push(proj);
      }
      projectilesRef.current = newProjectiles;

      explosionsRef.current = explosionsRef.current
        .map((ex) => {
          const next = { ...ex };
          next.r += (next.maxR / 0.6) * dt;
          next.life -= dt;
          if (next.life > 0) {
            if (next.owner === "player") {
              const dx = en.x - next.x;
              const dy = en.y - next.y;
              if (dx * dx + dy * dy <= (next.r + en.r * 0.6) ** 2) {
                enemyHpRef.current = Math.max(0, enemyHpRef.current - next.damage * dt);
                setEnemyHp(enemyHpRef.current);
              }
            } else {
              const dx = p.x - next.x;
              const dy = p.y - next.y;
              if (dx * dx + dy * dy <= (next.r + p.r) ** 2) {
                playerHpRef.current = Math.max(0, playerHpRef.current - next.damage * dt);
                setPlayerHp(playerHpRef.current);
              }
            }
          }
          return next;
        })
        .filter((ex) => ex.life > 0);

      embersRef.current = embersRef.current
        .map((em) => {
          const next = { ...em };
          next.x += next.vx * dt;
          next.y += next.vy * dt;
          next.vy += GRAVITY * dt * 0.6;
          next.life -= dt;
          return next;
        })
        .filter((em) => em.life > 0);

      if (playerHpRef.current <= 0) {
        setGameState("lose");
      }
      if (enemyHpRef.current <= 0) {
        if (stageRef.current < STAGES.length) {
          startStage(stageRef.current + 1, true);
        } else {
          setGameState("win");
        }
      }
    };

    const draw = (nowMs: number) => {
      syncCanvasSize();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const v = viewRef.current;
      ctx.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
      ctx.translate(v.offsetX, v.offsetY);
      ctx.scale(v.scale, v.scale);
      drawBackground(stageRef.current - 1);

      const p = playerRef.current;
      
      // === DRAW PLAYER ===
      ctx.save();
      ctx.translate(p.x, p.y);
      
      // Hero Aura
      ctx.shadowBlur = 15;
      ctx.shadowColor = "rgba(59,130,246,0.5)";

      // Cape (animated)
      const capePhase = nowMs * 0.005;
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.moveTo(-8, -20);
      ctx.quadraticCurveTo(-25 + Math.sin(capePhase)*5, 0, -20 + Math.cos(capePhase)*5, 25);
      ctx.lineTo(-5, 20);
      ctx.fill();

      // Body Armor
      const bodyGrad = ctx.createLinearGradient(-12, -20, 12, 20);
      bodyGrad.addColorStop(0, "#3b82f6");
      bodyGrad.addColorStop(1, "#1d4ed8");
      ctx.fillStyle = bodyGrad;
      
      // Legs
      ctx.fillRect(-8, 10, 6, 15);
      ctx.fillRect(2, 10, 6, 15);

      // Torso
      ctx.beginPath();
      ctx.moveTo(-12, -15);
      ctx.lineTo(12, -15);
      ctx.lineTo(8, 10);
      ctx.lineTo(-8, 10);
      ctx.fill();

      // Head
      ctx.fillStyle = "#60a5fa";
      ctx.beginPath();
      ctx.arc(0, -22, 10, 0, Math.PI * 2);
      ctx.fill();

      // Visor
      ctx.fillStyle = "#fde047";
      ctx.fillRect(2, -24, 6, 3);

      // Weapon Visualization
      ctx.shadowBlur = 0;
      const cooldownReady = 
         (p.weapon === "laser" && nowMs > p.lastShotMs + WEAPON_STATS.laser.cooldown) ||
         (p.weapon === "missile" && nowMs > p.lastMissileMs + WEAPON_STATS.missile.cooldown) ||
         (p.weapon === "bomb" && nowMs > p.lastBombMs + WEAPON_STATS.bomb.cooldown);

      // Loading Indicator (Bar above head)
      if (!cooldownReady) {
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.fillRect(-10, -40, 20, 3);
        ctx.fillStyle = "#00ff00";
        let progress = 0;
        if (p.weapon === "laser") progress = (nowMs - p.lastShotMs) / WEAPON_STATS.laser.cooldown;
        if (p.weapon === "missile") progress = (nowMs - p.lastMissileMs) / WEAPON_STATS.missile.cooldown;
        if (p.weapon === "bomb") progress = (nowMs - p.lastBombMs) / WEAPON_STATS.bomb.cooldown;
        ctx.fillRect(-10, -40, 20 * Math.min(1, progress), 3);
      }

      // Draw Gun or Bomb in Hand
      if (p.weapon === "laser" || p.weapon === "missile") {
          // Gun
          ctx.fillStyle = "#94a3b8";
          ctx.fillRect(5, -5, 20, 6); // Barrel
          ctx.fillStyle = "#475569";
          ctx.fillRect(5, -2, 8, 8); // Handle
          
          // Muzzle flash
          if (p.holdUntil > nowMs && p.holdType !== "bomb") {
              ctx.fillStyle = "#fef08a";
              ctx.beginPath();
              ctx.arc(25, -2, 6 + Math.random()*4, 0, Math.PI*2);
              ctx.fill();
          }
      } else if (p.weapon === "bomb") {
          // Holding Bomb
          if (cooldownReady || (p.holdUntil > nowMs && p.holdType === "bomb")) {
             ctx.fillStyle = "#ef4444";
             ctx.beginPath();
             ctx.arc(15, -5, 6, 0, Math.PI*2);
             ctx.fill();
             // Spark
             ctx.fillStyle = "#fbbf24";
             ctx.beginPath();
             ctx.arc(15 + Math.random()*2, -11, 2, 0, Math.PI*2);
             ctx.fill();
          }
      }

      ctx.restore();

      // Drone
      if (p.droneUntil > nowMs) {
        const dx = p.x + 40;
        const dy = p.y - 50;
        ctx.save();
        ctx.translate(dx, dy);
        ctx.shadowBlur = 16;
        ctx.shadowColor = "rgba(45,212,191,0.6)";
        ctx.fillStyle = "#14b8a6";
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.6)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // === DRAW ENEMY ===
      const en = enemyRef.current;
      ctx.save();
      ctx.translate(en.x, en.y);
      
      // Mech Dino Body
      const enGrad = ctx.createLinearGradient(-30, -30, 30, 30);
      enGrad.addColorStop(0, "#14532d");
      enGrad.addColorStop(1, "#15803d");
      ctx.fillStyle = enGrad;
      
      // Main Body
      ctx.beginPath();
      ctx.ellipse(0, 0, 45, 30, 0, 0, Math.PI*2);
      ctx.fill();
      
      // Head
      ctx.save();
      ctx.translate(-40, -20);
      ctx.fillStyle = "#166534";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-30, 5); // Snout
      ctx.lineTo(-25, 25); // Jaw
      ctx.lineTo(10, 20);
      ctx.fill();
      
      // Glowing Eye
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#f00";
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(-15, 5, 4, 0, Math.PI*2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Open mouth if firing
      if (nowMs < en.flameUntilMs || nowMs + 500 > en.nextFireMs) {
           ctx.fillStyle = "#f97316";
           ctx.beginPath();
           ctx.arc(-30, 15, 6 + Math.random()*4, 0, Math.PI*2);
           ctx.fill();
      }
      ctx.restore();

      // Back Cannon (Rocket)
      ctx.fillStyle = "#374151";
      ctx.save();
      ctx.translate(10, -25);
      ctx.rotate(-0.5);
      ctx.fillRect(-10, -5, 30, 10);
      ctx.restore();

      // Legs
      ctx.fillStyle = "#14532d";
      ctx.fillRect(-20, 20, 15, 30); // Front
      ctx.fillRect(10, 20, 15, 30); // Back

      ctx.restore();

      // Draw Projectiles
      projectilesRef.current.forEach((proj) => {
        ctx.save();
        ctx.translate(proj.x, proj.y);
        ctx.fillStyle = proj.owner === "player" ? "#60a5fa" : "#f87171";
        if (proj.kind === "bomb") ctx.fillStyle = "#ef4444";
        if (proj.kind === "lava") ctx.fillStyle = "#ea580c";
        if (proj.kind === "drone") ctx.fillStyle = "#2dd4bf";

        if (proj.kind === "bomb" || proj.kind === "lava") {
            ctx.beginPath();
            ctx.arc(0, 0, proj.r, 0, Math.PI * 2);
            ctx.fill();
            // Rotating fuse/spark
            ctx.rotate(nowMs * 0.01);
            ctx.fillStyle = "#fbbf24";
            ctx.fillRect(-2, -proj.r-4, 4, 6);
        } else if (proj.kind === "laser" || proj.kind === "drone") {
            ctx.fillRect(-proj.r, -proj.r/2, proj.r*2, proj.r);
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, proj.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
      });

      // Draw Explosions
      explosionsRef.current.forEach((ex) => {
        ctx.save();
        ctx.translate(ex.x, ex.y);
        ctx.globalAlpha = ex.life * 2;
        ctx.fillStyle = ex.owner === "player" ? "#fca5a5" : "#fdba74";
        ctx.beginPath();
        ctx.arc(0, 0, ex.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw Embers
      embersRef.current.forEach((em) => {
        ctx.save();
        ctx.translate(em.x, em.y);
        ctx.fillStyle = em.color;
        ctx.globalAlpha = em.life;
        ctx.fillRect(-em.size / 2, -em.size / 2, em.size, em.size);
        ctx.restore();
      });

      drawPowerGraph();

      ctx.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
      const bw = WORLD_WIDTH * v.scale;
      const bh = WORLD_HEIGHT * v.scale;
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
      ctx.lineWidth = 8;
      ctx.strokeRect(v.offsetX, v.offsetY, bw, bh);
      ctx.strokeStyle = "rgba(56, 189, 248, 0.28)";
      ctx.lineWidth = 2;
      ctx.strokeRect(v.offsetX + 4, v.offsetY + 4, bw - 8, bh - 8);
      ctx.restore();
    };

    const loop = (time: number) => {
      tick(time);
      draw(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      if (ro) ro.disconnect();
    };
  }, [startGame, startStage, addExplosion, emitEmbers, fireWeapon, spawnEnemyAttack]);

  const weaponLabel = weapon.toUpperCase();

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-2 select-none font-sans">
      <div className="w-full max-w-[920px] relative">
        <div className="flex items-center justify-between mb-4 px-4 py-3 bg-zinc-900/80 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md">
          <Link href="/" className="text-zinc-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <div className="flex flex-col items-center">
            <h1 className="text-xl md:text-2xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              SUPER HERO <span className="text-white">VS</span> DINO
            </h1>
            <div className="text-[10px] text-zinc-500 font-bold tracking-widest">STAGE {stage} - {STAGES[clamp(stage-1,0,4)].name}</div>
          </div>
          <div className="w-6" />
        </div>

        <div className="flex gap-4 mb-2 px-2">
          <div className="flex-1">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-400/20 border border-blue-400/60 flex items-center justify-center shadow-[0_0_12px_rgba(59,130,246,0.4)]">
                  <span className="text-sm">🛡️</span>
                </div>
                <span className="font-bold tracking-wider text-xs text-blue-100">HERO</span>
              </div>
              <span className="font-mono text-xs">{Math.round(playerHp)}</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{ width: `${(Math.max(0, playerHp) / STAGES[clamp(stage-1,0,4)].playerMaxHp) * 100}%` }} />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-500/30 to-orange-400/20 border border-rose-400/60 flex items-center justify-center shadow-[0_0_12px_rgba(244,63,94,0.35)]">
                  <span className="text-sm">🦖</span>
                </div>
                <span className="font-bold tracking-wider text-xs text-rose-100">DINO</span>
              </div>
              <span className="font-mono text-xs">{Math.round(enemyHp)}</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-rose-400 to-orange-400" style={{ width: `${(Math.max(0, enemyHp) / STAGES[clamp(stage-1,0,4)].enemyMaxHp) * 100}%` }} />
            </div>
          </div>
          <div className="hidden md:flex flex-col items-end text-[10px] text-zinc-400 gap-1">
            <span>WEAPON: {weaponLabel}</span>
            <span>SCORE: {score}</span>
          </div>
          <div className="flex md:hidden items-center justify-between text-[10px] text-zinc-400">
            <span>WEAPON: {weaponLabel}</span>
            <span>SCORE: {score}</span>
          </div>
        </div>

        <div className="rounded-3xl border border-transparent ring-1 ring-white/10 shadow-[0_0_60px_rgba(0,0,0,0.6)] overflow-hidden bg-black/40 backdrop-blur-xl">
          <canvas ref={canvasRef} className="block w-full h-[58vh] max-h-[520px] bg-black" style={{ touchAction: "none" }} />

          {gameState !== "playing" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
              <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-sky-200 to-rose-400 mb-4">
                {gameState === "idle" && "READY FOR IMPACT"}
                {gameState === "win" && "CITY SAVED"}
                {gameState === "lose" && "HERO DOWN"}
              </h2>
              <div className="text-[10px] md:text-xs text-zinc-300 font-press-start text-center space-y-1">
                <div>MOVE: WASD / ARROWS</div>
                <div>JUMP: SPACE</div>
                <div>FIRE: J OR TAP</div>
                <div>WEAPON: 1-3 (BOMB: PRESS 3 THEN J)</div>
                <div>MACHINE DRONE: R</div>
              </div>
              <button
                onClick={startGame}
                className="mt-6 px-8 py-3 rounded-full bg-sky-400 text-black font-bold shadow-[0_0_25px_rgba(56,189,248,0.5)] hover:bg-sky-300 transition-all"
              >
                {gameState === "idle" ? "START MISSION" : "REDEPLOY"}
              </button>
              <Link href="/" className="mt-5 text-[10px] text-zinc-500 hover:text-white font-press-start">
                EXIT TO MENU
              </Link>
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] font-press-start text-zinc-400">
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <div className="text-zinc-200">LASER</div>
            <div>FAST BEAM</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <div className="text-zinc-200">MISSILE</div>
            <div>HIGH IMPACT</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <div className="text-zinc-200">BOMB</div>
            <div>PRESS 3 THEN J</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <div className="text-zinc-200">DINO FIRE</div>
            <div>DODGE THE FLAME</div>
          </div>
        </div>

        <div className="mt-6 md:hidden grid grid-cols-3 gap-3 text-[10px] font-press-start">
          <button
            onPointerDown={() => keysRef.current.left = true}
            onPointerUp={() => keysRef.current.left = false}
            className="p-4 bg-white/10 rounded-xl active:bg-white/20"
          >
            ←
          </button>
          <button
            onPointerDown={() => keysRef.current.jump = true}
            onPointerUp={() => keysRef.current.jump = false}
            className="p-4 bg-white/10 rounded-xl active:bg-white/20"
          >
            JUMP
          </button>
          <button
            onPointerDown={() => keysRef.current.right = true}
            onPointerUp={() => keysRef.current.right = false}
            className="p-4 bg-white/10 rounded-xl active:bg-white/20"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupermanDinoGame;
