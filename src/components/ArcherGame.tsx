"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

type Arrow = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

type Duck = {
  x: number;
  y: number;
  vx: number;
  flapOffset: number;
};

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const GROUND_Y = 430;
const PLAYER_RADIUS = 18;
const MIN_ANGLE = -Math.PI * 0.9;
const MAX_ANGLE = -Math.PI * 0.1;
const TARGET_PER_STAGE = 10;
const RELOAD_DURATION = 600;
const SHOULDER_Y = -50;
const ARM_LEN = 20;
const BOW_TIP_OFFSET = 8;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const ArcherGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const arrowsRef = useRef<Arrow[]>([]);
  const ducksRef = useRef<Duck[]>([]);
  const playerXRef = useRef(CANVAS_WIDTH * 0.3);
  const aimAngleRef = useRef(-Math.PI / 3);
  const movingRef = useRef({ left: false, right: false });
  const aimingRef = useRef({ up: false, down: false });
  const isRunningRef = useRef(false);
  const scoreRef = useRef(0);
  const stageRef = useRef(1);
  const stageScoreRef = useRef(0);
  const pointerDownRef = useRef(false);
  const touchShootOnReleaseRef = useRef(false);
  
  // Reloading State
  const isReloadingRef = useRef(false);
  const reloadStartTimeRef = useRef(0);

  const [isRunning, setIsRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    if (typeof window === "undefined") return 0;
    const saved = localStorage.getItem("archer-highscore");
    const n = saved ? parseInt(saved, 10) : 0;
    return Number.isFinite(n) ? n : 0;
  });
  const [stage, setStage] = useState(1);
  const [stageScore, setStageScore] = useState(0);
  const [stageComplete, setStageComplete] = useState(false);
  const [nextStage, setNextStage] = useState(2);

  const resetGame = useCallback(() => {
    arrowsRef.current = [];
    ducksRef.current = [];
    playerXRef.current = CANVAS_WIDTH * 0.3;
    aimAngleRef.current = -Math.PI / 3;
    scoreRef.current = 0;
    stageRef.current = 1;
    stageScoreRef.current = 0;
    isReloadingRef.current = false;
    reloadStartTimeRef.current = 0;
    setScore(0);
    setStage(1);
    setStageScore(0);
    setStageComplete(false);
    setNextStage(2);
    lastSpawnRef.current = 0;
    lastTimeRef.current = 0;
  }, []);

  const startStage = useCallback((stageNumber: number, keepScore: boolean) => {
    arrowsRef.current = [];
    ducksRef.current = [];
    playerXRef.current = CANVAS_WIDTH * 0.3;
    aimAngleRef.current = -Math.PI / 3;
    stageRef.current = stageNumber;
    stageScoreRef.current = 0;
    isReloadingRef.current = false;
    reloadStartTimeRef.current = 0;
    lastSpawnRef.current = 0;
    lastTimeRef.current = 0;
    if (!keepScore) {
      scoreRef.current = 0;
      setScore(0);
    } else {
      setScore(scoreRef.current);
    }
    setStage(stageNumber);
    setStageScore(0);
    setStageComplete(false);
    isRunningRef.current = true;
    setIsRunning(true);
  }, []);

  const stopGame = useCallback(() => {
    isRunningRef.current = false;
    setIsRunning(false);
  }, []);

  const shootArrow = useCallback((angleOverride?: number) => {
    if (!isRunningRef.current) return;
    if (isReloadingRef.current) return; // Cannot shoot while reloading

    const angle = clamp(angleOverride ?? aimAngleRef.current, MIN_ANGLE, MAX_ANGLE);
    const speed = 720;
    
    // Start Reload
    isReloadingRef.current = true;
    reloadStartTimeRef.current = performance.now();

    const playerX = playerXRef.current;
    const playerY = GROUND_Y - 2;
    const frontArmX = Math.cos(angle) * ARM_LEN;
    const frontArmY = SHOULDER_Y + Math.sin(angle) * ARM_LEN;
    const bowTipX = playerX + frontArmX + Math.cos(angle) * BOW_TIP_OFFSET;
    const bowTipY = playerY + frontArmY + Math.sin(angle) * BOW_TIP_OFFSET;

    arrowsRef.current.push({
      x: bowTipX,
      y: bowTipY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed
    });
  }, []);

  const updateAimFromPointer = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const x = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
    const y = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
    const dx = x - playerXRef.current;
    const dy = y - (GROUND_Y - PLAYER_RADIUS);
    if (dx === 0 && dy === 0) return;
    const angle = clamp(Math.atan2(dy, dx), MIN_ANGLE, MAX_ANGLE);
    aimAngleRef.current = angle;
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    pointerDownRef.current = true;
    updateAimFromPointer(e);
    if (!isRunningRef.current) {
      if (stageComplete) {
        startStage(nextStage, true);
      } else {
        startStage(1, false);
      }
      touchShootOnReleaseRef.current = false;
      return;
    }
    if (e.pointerType === "touch") {
      touchShootOnReleaseRef.current = true;
      return;
    }
    shootArrow();
  }, [nextStage, shootArrow, stageComplete, startStage, updateAimFromPointer]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!pointerDownRef.current && isRunningRef.current) {
      updateAimFromPointer(e);
      return;
    }
    if (pointerDownRef.current) updateAimFromPointer(e);
  }, [updateAimFromPointer]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    pointerDownRef.current = false;
    if (e.pointerType === "touch" && touchShootOnReleaseRef.current && isRunningRef.current) {
      touchShootOnReleaseRef.current = false;
      shootArrow();
    } else {
      touchShootOnReleaseRef.current = false;
    }
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, [shootArrow]);

  const drawScene = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // --- Background ---
    // Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    skyGrad.addColorStop(0, "#0f172a"); // Dark Slate
    skyGrad.addColorStop(1, "#1e293b"); // Slate
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, GROUND_Y);

    // Distant Trees / Mountains Silhouette
    ctx.fillStyle = "#111827";
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    for (let x = 0; x <= CANVAS_WIDTH; x += 20) {
        const h = Math.sin(x * 0.01) * 20 + Math.sin(x * 0.05) * 10;
        ctx.lineTo(x, GROUND_Y - 30 + h);
    }
    ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
    ctx.fill();

    // Ground Gradient
    const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_HEIGHT);
    groundGrad.addColorStop(0, "#14532d"); // Dark Green
    groundGrad.addColorStop(1, "#064e3b"); // Darker Green
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
    
    // Ground Top Border (Grass hint)
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
    ctx.stroke();

    // --- Ducks ---
    ducksRef.current.forEach((duck) => {
      const isFacingRight = duck.vx > 0;
      const wingPhase = Math.sin(time * 0.015 + duck.flapOffset); // -1 to 1
      const wingY = wingPhase * 10;
      
      ctx.save();
      ctx.translate(duck.x, duck.y);
      if (!isFacingRight) ctx.scale(-1, 1);

      // Duck Body
      ctx.fillStyle = "#a8a29e"; // Stone 400
      ctx.beginPath();
      ctx.ellipse(0, 0, 20, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Duck Wing (Back)
      ctx.fillStyle = "#78716c"; // Stone 500
      ctx.beginPath();
      ctx.moveTo(-5, -5);
      ctx.lineTo(10, -5 + wingY);
      ctx.lineTo(-5, 5);
      ctx.fill();

      // Duck Head (Green Mallard)
      ctx.fillStyle = "#15803d"; // Green 700
      ctx.beginPath();
      ctx.arc(14, -8, 9, 0, Math.PI * 2);
      ctx.fill();
      
      // Neck Band (White)
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(8, -2);
      ctx.quadraticCurveTo(14, 2, 20, -2);
      ctx.stroke();

      // Beak (Yellow/Orange)
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.moveTo(20, -10);
      ctx.lineTo(30, -6);
      ctx.lineTo(20, -4);
      ctx.fill();

      // Eye
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(16, -10, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.arc(17, -10, 1, 0, Math.PI * 2);
      ctx.fill();

      // Duck Wing (Front - overlaps body slightly)
      ctx.fillStyle = "#d6d3d1"; // Stone 300
      ctx.beginPath();
      ctx.moveTo(-2, -2);
      ctx.lineTo(15, -10 + wingY);
      ctx.lineTo(-2, 8);
      ctx.fill();

      ctx.restore();
    });

    // --- Arrows ---
    arrowsRef.current.forEach((arrow) => {
      const angle = Math.atan2(arrow.vy, arrow.vx);
      const len = 35;
      
      ctx.save();
      ctx.translate(arrow.x, arrow.y);
      ctx.rotate(angle);

      // Shaft
      ctx.strokeStyle = "#e2e8f0"; // Slate 200
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-len, 0);
      ctx.lineTo(0, 0);
      ctx.stroke();

      // Arrowhead
      ctx.fillStyle = "#94a3b8"; // Slate 400
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-8, -3);
      ctx.lineTo(-8, 3);
      ctx.fill();

      // Fletching (Feathers)
      ctx.fillStyle = "#ef4444"; // Red
      ctx.beginPath();
      ctx.moveTo(-len, 0);
      ctx.lineTo(-len + 8, -4);
      ctx.lineTo(-len + 4, 0);
      ctx.lineTo(-len + 8, 4);
      ctx.fill();

      ctx.restore();
    });

    // --- Archer (Player) ---
    const playerX = playerXRef.current;
    const playerY = GROUND_Y - 2; // Feet on ground
    const aimAngle = aimAngleRef.current;

    ctx.save();
    ctx.translate(playerX, playerY);

    // Legs
    ctx.strokeStyle = "#cbd5e1"; // Slate 300
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    
    // Back Leg
    ctx.beginPath();
    ctx.moveTo(-5, -25); // Hip
    ctx.lineTo(-10, 0); // Foot
    ctx.stroke();

    // Front Leg
    ctx.beginPath();
    ctx.moveTo(5, -25); // Hip
    ctx.lineTo(15, 0); // Foot
    ctx.stroke();

    // Torso
    ctx.strokeStyle = "#e2e8f0"; // Slate 200
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, -25); // Hip
    ctx.lineTo(0, -55); // Neck
    ctx.stroke();

    // Head
    ctx.fillStyle = "#fcd34d"; // Amber 300 (Skin/Helmet)
    ctx.beginPath();
    ctx.arc(0, -62, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Headband/Hat
    ctx.fillStyle = "#0ea5e9"; // Sky 500
    ctx.beginPath();
    ctx.arc(0, -64, 8, Math.PI, 0);
    ctx.fill();

    // Arms (Aiming)
    const shoulderX = 0;
    const shoulderY = SHOULDER_Y;
    const armLen = ARM_LEN;
    
    let drawFactor = 1;
    let showArrowOnBow = true;
    
    if (isReloadingRef.current) {
      const elapsed = time - reloadStartTimeRef.current;
      if (elapsed < 90) {
        drawFactor = 0;
        showArrowOnBow = false;
      } else if (elapsed < RELOAD_DURATION * 0.6) {
        drawFactor = 0;
        showArrowOnBow = false;
      } else {
        const pullProgress = (elapsed - RELOAD_DURATION * 0.6) / (RELOAD_DURATION * 0.4);
        drawFactor = clamp(pullProgress, 0, 1);
        showArrowOnBow = drawFactor > 0.15;
      }
    }

    const pullDist = drawFactor * 20;
    
    // Front Arm (Holding bow) - Always steady
    const frontArmX = shoulderX + Math.cos(aimAngle) * armLen;
    const frontArmY = shoulderY + Math.sin(aimAngle) * armLen;

    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 3;
    
    // Draw Front Arm
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    ctx.lineTo(frontArmX, frontArmY);
    ctx.stroke();

    // Draw Bow
    ctx.save();
    ctx.translate(frontArmX, frontArmY);
    ctx.rotate(aimAngle);
    
    // Bow Wood
    ctx.strokeStyle = "#d97706"; // Amber 600
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 25, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    
    // Bow String
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -25); // Top tip
    ctx.lineTo(-pullDist, 0); // Nocking point
    ctx.lineTo(0, 25); // Bottom tip
    ctx.stroke();
    
    ctx.restore();

    const pullHandX = frontArmX + Math.cos(aimAngle) * -pullDist;
    const pullHandY = frontArmY + Math.sin(aimAngle) * -pullDist;
    
    let handX = pullHandX;
    let handY = pullHandY;
    
    if (isReloadingRef.current) {
      const elapsed = time - reloadStartTimeRef.current;
      if (elapsed < 140) {
        handX = frontArmX + Math.cos(aimAngle) * -20;
        handY = frontArmY + Math.sin(aimAngle) * -20;
      } else if (elapsed < RELOAD_DURATION * 0.6) {
        handX = frontArmX;
        handY = frontArmY;
      }
    }
    
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    ctx.lineTo(handX, handY); 
    ctx.stroke();

    if (showArrowOnBow) {
      ctx.save();
      ctx.translate(pullHandX, pullHandY);
      ctx.rotate(aimAngle);
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(35, 0);
      ctx.stroke();
      ctx.fillStyle = "#94a3b8";
      ctx.beginPath();
      ctx.moveTo(35, 0);
      ctx.lineTo(27, -3);
      ctx.lineTo(27, 3);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();

    // Aim Line (Guide)
    const aimLength = 100;
    const guideStartX = playerX + Math.cos(aimAngle) * 30;
    const guideStartY = playerY - 50 + Math.sin(aimAngle) * 30;
    const guideEndX = guideStartX + Math.cos(aimAngle) * aimLength;
    const guideEndY = guideStartY + Math.sin(aimAngle) * aimLength;

    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(guideStartX, guideStartY);
    ctx.lineTo(guideEndX, guideEndY);
    ctx.stroke();
    ctx.setLineDash([]);

  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(e.code)) {
        e.preventDefault();
      }
      if (e.code === "Space") {
        if (!isRunningRef.current) {
          if (stageComplete) {
            startStage(nextStage, true);
          } else {
            startStage(1, false);
          }
          return;
        }
        shootArrow();
        return;
      }
      if (e.code === "ArrowLeft" || e.code === "KeyA") movingRef.current.left = true;
      if (e.code === "ArrowRight" || e.code === "KeyD") movingRef.current.right = true;
      if (e.code === "ArrowUp" || e.code === "KeyW") aimingRef.current.up = true;
      if (e.code === "ArrowDown" || e.code === "KeyS") aimingRef.current.down = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") movingRef.current.left = false;
      if (e.code === "ArrowRight" || e.code === "KeyD") movingRef.current.right = false;
      if (e.code === "ArrowUp" || e.code === "KeyW") aimingRef.current.up = false;
      if (e.code === "ArrowDown" || e.code === "KeyS") aimingRef.current.down = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [nextStage, shootArrow, stageComplete, startStage]);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    const update = (time: number) => {
      if (!isRunningRef.current) {
        drawScene(time);
        rafRef.current = requestAnimationFrame(update);
        return;
      }

      if (!lastTimeRef.current) lastTimeRef.current = time;
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;
      const deltaSec = delta / 1000;

      // Handle Reloading
      if (isReloadingRef.current) {
        if (time - reloadStartTimeRef.current > RELOAD_DURATION) {
            isReloadingRef.current = false;
        }
      }

      const moveSpeed = 320;
      if (movingRef.current.left) playerXRef.current -= moveSpeed * deltaSec;
      if (movingRef.current.right) playerXRef.current += moveSpeed * deltaSec;
      playerXRef.current = clamp(playerXRef.current, 30, CANVAS_WIDTH - 30);

      const aimSpeed = 1.6;
      if (aimingRef.current.up) aimAngleRef.current -= aimSpeed * deltaSec;
      if (aimingRef.current.down) aimAngleRef.current += aimSpeed * deltaSec;
      aimAngleRef.current = clamp(aimAngleRef.current, MIN_ANGLE, MAX_ANGLE);

      const gravity = 860;
      arrowsRef.current = arrowsRef.current
        .map((arrow) => ({
          ...arrow,
          x: arrow.x + arrow.vx * deltaSec,
          y: arrow.y + arrow.vy * deltaSec,
          vy: arrow.vy + gravity * deltaSec
        }))
        .filter((arrow) => arrow.x > -40 && arrow.x < CANVAS_WIDTH + 40 && arrow.y < CANVAS_HEIGHT + 60);

      const baseSpeed = 120 + (stageRef.current - 1) * 24;
      const spawnInterval = Math.max(900 - stageRef.current * 60, 420);
      if (!lastSpawnRef.current) lastSpawnRef.current = time;
      if (time - lastSpawnRef.current > spawnInterval) {
        lastSpawnRef.current = time;
        const fromLeft = Math.random() > 0.5;
        const startX = fromLeft ? -20 : CANVAS_WIDTH + 20;
        const targetY = 70 + Math.random() * 180;
        const speed = baseSpeed + Math.random() * 40;
        const vx = fromLeft ? speed : -speed;
        ducksRef.current.push({
          x: startX,
          y: targetY,
          vx,
          flapOffset: Math.random() * Math.PI * 2
        });
      }

      ducksRef.current = ducksRef.current
        .map((duck) => ({ ...duck, x: duck.x + duck.vx * deltaSec }))
        .filter((duck) => duck.x > -60 && duck.x < CANVAS_WIDTH + 60);

      let hits = 0;
      const usedArrows = new Set<number>();
      const hitDucks = new Set<number>();
      ducksRef.current.forEach((duck, di) => {
        arrowsRef.current.forEach((arrow, ai) => {
          if (usedArrows.has(ai) || hitDucks.has(di)) return;
          const dx = duck.x - arrow.x;
          const dy = duck.y - arrow.y;
          if (dx * dx + dy * dy <= 18 * 18) {
            usedArrows.add(ai);
            hitDucks.add(di);
            hits += 1;
          }
        });
      });

      if (hits > 0) {
        scoreRef.current += hits;
        stageScoreRef.current += hits;
        setScore(scoreRef.current);
        setHighScore((prev) => {
          if (scoreRef.current > prev) {
            localStorage.setItem("archer-highscore", String(scoreRef.current));
            return scoreRef.current;
          }
          return prev;
        });
        if (stageScoreRef.current >= TARGET_PER_STAGE) {
          stageScoreRef.current = 0;
          setStageScore(0);
          setStageComplete(true);
          setNextStage(stageRef.current + 1);
          isRunningRef.current = false;
          setIsRunning(false);
          ducksRef.current = [];
          arrowsRef.current = [];
          drawScene(time);
          rafRef.current = requestAnimationFrame(update);
          return;
        }
        setStageScore(stageScoreRef.current);
      }

      if (hitDucks.size > 0 || usedArrows.size > 0) {
        ducksRef.current = ducksRef.current.filter((_, index) => !hitDucks.has(index));
        arrowsRef.current = arrowsRef.current.filter((_, index) => !usedArrows.has(index));
      }

      drawScene(time);
      rafRef.current = requestAnimationFrame(update);
    };

    rafRef.current = requestAnimationFrame(update);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [drawScene, startStage]);

  useEffect(() => {
    drawScene(performance.now());
  }, [drawScene]);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-zinc-900 p-4 font-orbitron text-white">
      <div className="absolute top-8 flex justify-between w-full max-w-[860px] px-8 z-10 pointer-events-none">
        <div className="flex flex-col">
          <span className="text-amber-300 font-press-start text-xs mb-1">SCORE</span>
          <span className="text-4xl font-black text-white font-mono">{score.toString().padStart(6, "0")}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-fuchsia-300 font-press-start text-xs mb-1">HI-SCORE</span>
          <span className="text-3xl text-white font-mono font-bold">{highScore.toString().padStart(6, "0")}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-cyan-300 font-press-start text-xs mb-1">STAGE</span>
          <span className="text-3xl text-white font-mono font-bold">{stage}</span>
          <span className="text-[10px] text-zinc-400 font-press-start mt-1">{stageScore}/{TARGET_PER_STAGE} HITS</span>
        </div>
      </div>

      <div className="relative rounded-lg overflow-hidden border-4 border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="bg-black block max-w-[min(92vw,860px)] max-h-[70vh] w-auto h-auto"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ touchAction: "none" }}
        />

        {!isRunning && !stageComplete && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-20">
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-orange-500 drop-shadow-[0_0_20px_rgba(251,191,36,0.4)] mb-6 font-press-start">
              DUCK HUNT
            </h1>
            <div className="flex flex-col items-center gap-3 text-zinc-300 text-xs font-press-start text-center">
              <span>MOVE: ARROWS / A-D</span>
              <span>AIM: W-S OR DRAG</span>
              <span>SHOOT: SPACE OR TAP</span>
            </div>
            <button
              onClick={() => startStage(1, false)}
              className="mt-8 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded shadow-[0_0_20px_rgba(251,191,36,0.5)] transition-all hover:scale-105 active:scale-95 font-press-start text-sm"
            >
              START HUNT
            </button>
            <Link href="/" className="mt-6 text-zinc-500 hover:text-white text-[10px] font-press-start hover:underline">
              EXIT TO MENU
            </Link>
          </div>
        )}
        {!isRunning && stageComplete && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-20">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-indigo-400 drop-shadow-[0_0_18px_rgba(56,189,248,0.4)] mb-4 font-press-start">
              STAGE {stage} COMPLETE
            </h1>
            <div className="flex flex-col items-center gap-2 text-zinc-300 text-xs font-press-start text-center">
              <span>SCORE: {score.toString().padStart(6, "0")}</span>
              <span>HI-SCORE: {highScore.toString().padStart(6, "0")}</span>
            </div>
            <button
              onClick={() => startStage(nextStage, true)}
              className="mt-6 px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-all hover:scale-105 active:scale-95 font-press-start text-sm"
            >
              START STAGE {nextStage}
            </button>
            <Link href="/" className="mt-6 text-zinc-500 hover:text-white text-[10px] font-press-start hover:underline">
              EXIT TO MENU
            </Link>
          </div>
        )}
      </div>

      <div className="mt-6 text-zinc-500 text-[10px] font-press-start tracking-widest text-center">
        HIT 10 DUCKS TO UNLOCK NEXT STAGE
      </div>

      <div className="w-full max-w-[420px] md:hidden flex items-center justify-between gap-4 mt-4">
        <div className="grid grid-cols-3 gap-2">
          <div />
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              aimingRef.current.up = true;
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              aimingRef.current.up = false;
              if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
            }}
            onPointerCancel={() => {
              aimingRef.current.up = false;
            }}
            className="w-16 h-16 bg-zinc-900 border border-amber-500/40 text-amber-300 font-press-start text-[11px] shadow-[0_0_15px_rgba(251,191,36,0.15)] active:scale-95"
            type="button"
          >
            AIM+
          </button>
          <div />
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              movingRef.current.left = true;
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              movingRef.current.left = false;
              if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
            }}
            onPointerCancel={() => {
              movingRef.current.left = false;
            }}
            className="w-16 h-16 bg-zinc-900 border border-amber-500/40 text-amber-300 font-press-start text-[11px] shadow-[0_0_15px_rgba(251,191,36,0.15)] active:scale-95"
            type="button"
          >
            LEFT
          </button>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              shootArrow();
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
            }}
            className="w-16 h-16 bg-amber-500 text-black font-press-start text-[11px] shadow-[0_0_20px_rgba(251,191,36,0.35)] active:scale-95"
            type="button"
          >
            SHOOT
          </button>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              movingRef.current.right = true;
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              movingRef.current.right = false;
              if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
            }}
            onPointerCancel={() => {
              movingRef.current.right = false;
            }}
            className="w-16 h-16 bg-zinc-900 border border-amber-500/40 text-amber-300 font-press-start text-[11px] shadow-[0_0_15px_rgba(251,191,36,0.15)] active:scale-95"
            type="button"
          >
            RIGHT
          </button>
          <div />
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              aimingRef.current.down = true;
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              aimingRef.current.down = false;
              if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
            }}
            onPointerCancel={() => {
              aimingRef.current.down = false;
            }}
            className="w-16 h-16 bg-zinc-900 border border-amber-500/40 text-amber-300 font-press-start text-[11px] shadow-[0_0_15px_rgba(251,191,36,0.15)] active:scale-95"
            type="button"
          >
            AIM-
          </button>
          <div />
        </div>
      </div>

      {isRunning && (
        <button
          onClick={() => {
            stopGame();
            resetGame();
          }}
          className="mt-6 px-5 py-2 bg-white/10 text-white text-[10px] font-press-start rounded border border-white/10 hover:bg-white/20 transition"
          type="button"
        >
          RESET
        </button>
      )}
    </div>
  );
};

export default ArcherGame;
