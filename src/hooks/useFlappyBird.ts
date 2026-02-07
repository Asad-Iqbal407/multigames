"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { flappyAudio } from '../utils/flappyAudio';

// Game Constants
export const GRAVITY = 0.45;
export const JUMP_STRENGTH = -7;
export const PIPE_SPEED = 2.5;
export const PIPE_SPAWN_RATE = 1800; // ms
export const PIPE_WIDTH = 60;
export const PIPE_GAP = 160;
export const BIRD_SIZE = 24;

export interface Pipe {
  x: number;
  topHeight: number;
  passed: boolean;
}

export const useFlappyBird = (canvasWidth: number, canvasHeight: number) => {
  // Rendering State
  const [birdY, setBirdY] = useState(canvasHeight / 2);
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const saved = localStorage.getItem('flappyHighScore');
    const parsed = saved ? parseInt(saved, 10) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  });
  const [isGameActive, setIsGameActive] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [birdRotation, setBirdRotation] = useState(0);

  // Physics Refs (Source of Truth for Loop)
  const birdYRef = useRef(canvasHeight / 2);
  const birdVelocityRef = useRef(0);
  const pipesRef = useRef<Pipe[]>([]);
  const lastPipeTimeRef = useRef<number>(0);
  const isGameActiveRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('flappyHighScore', highScore.toString());
  }, [highScore]);

  const startGame = useCallback(() => {
    birdYRef.current = canvasHeight / 2;
    birdVelocityRef.current = 0;
    pipesRef.current = [];
    
    setBirdY(birdYRef.current);
    setPipes([]);
    setScore(0);
    setIsGameActive(true);
    setIsGameOver(false);
    isGameActiveRef.current = true;
    
    lastPipeTimeRef.current = performance.now();
    flappyAudio.init();
    // Don't spawn immediately, wait for the first interval in loop
  }, [canvasHeight]);

  const jump = useCallback(() => {
    if (!isGameActiveRef.current) return;
    birdVelocityRef.current = JUMP_STRENGTH;
    flappyAudio.playJump();
  }, []);

  const gameOver = useCallback(() => {
    setIsGameActive(false);
    setIsGameOver(true);
    isGameActiveRef.current = false;
    flappyAudio.playCrash();
  }, []);

  // Main Game Loop Effect
  useEffect(() => {
    let animationFrameId: number;

    const loop = (timestamp: number) => {
      if (isGameActiveRef.current) {
        // 1. Update Bird Physics
        birdVelocityRef.current += GRAVITY;
        birdYRef.current += birdVelocityRef.current;

        // 2. Update Rotation based on velocity
        const rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, birdVelocityRef.current * 0.1));
        setBirdRotation(rotation);

        // 3. Update Pipes
        const newPipes = pipesRef.current
          .map(pipe => ({ ...pipe, x: pipe.x - PIPE_SPEED }))
          .filter(pipe => pipe.x + PIPE_WIDTH > -50);
        
        // Check for score
        newPipes.forEach(pipe => {
          if (!pipe.passed && pipe.x + PIPE_WIDTH < 50) { // 50 is bird X
            pipe.passed = true;
            setScore(s => {
              const next = s + 1;
              setHighScore(h => (next > h ? next : h));
              return next;
            });
            flappyAudio.playScore();
          }
        });
        
        pipesRef.current = newPipes;

        // 4. Spawn Pipe Logic
        if (timestamp - lastPipeTimeRef.current > PIPE_SPAWN_RATE) {
          const minHeight = 80;
          const maxHeight = canvasHeight - PIPE_GAP - minHeight;
          const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
          
          pipesRef.current.push({
            x: canvasWidth,
            topHeight,
            passed: false
          });
          lastPipeTimeRef.current = timestamp;
        }

        // 5. Collision Detection
        const birdLeft = 50;
        const birdRight = birdLeft + BIRD_SIZE - 4; // Slight margin for fairness
        const birdTop = birdYRef.current + 4;
        const birdBottom = birdYRef.current + BIRD_SIZE - 4;

        let collided = false;
        // Boundary Check
        if (birdYRef.current + BIRD_SIZE > canvasHeight || birdYRef.current < 0) {
          collided = true;
        } else {
          // Pipe Collision
          for (const pipe of pipesRef.current) {
            const pipeLeft = pipe.x;
            const pipeRight = pipe.x + PIPE_WIDTH;

            if (birdRight > pipeLeft && birdLeft < pipeRight) {
              if (birdTop < pipe.topHeight || birdBottom > pipe.topHeight + PIPE_GAP) {
                collided = true;
                break;
              }
            }
          }
        }

        if (collided) {
          gameOver();
          return;
        }
        
        setBirdY(birdYRef.current);
        setPipes([...pipesRef.current]);
      } else if (!isGameOver) {
        // Hover effect for "Ready" state
        const hoverOffset = Math.sin(timestamp / 200) * 10;
        setBirdY(canvasHeight / 2 + hoverOffset);
        setBirdRotation(0);
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animationFrameId);
  }, [canvasHeight, canvasWidth, gameOver, isGameOver]);

  return {
    birdY,
    birdRotation,
    pipes,
    score,
    highScore,
    isGameActive,
    isGameOver,
    startGame,
    jump
  };
};
