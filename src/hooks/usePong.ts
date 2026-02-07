"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { pongAudio } from '../utils/pongAudio';

// Game Constants
export const PADDLE_WIDTH = 10;
export const PADDLE_HEIGHT = 100;
export const BALL_SIZE = 12;
export const INITIAL_BALL_SPEED = 5;
export const BALL_SPEED_INCREMENT = 0.2;
export const AI_SPEED = 4.5;
export const PLAYER_SPEED = 8;

export interface PongState {
  playerY: number;
  aiY: number;
  ballX: number;
  ballY: number;
  ballDX: number;
  ballDY: number;
  playerScore: number;
  aiScore: number;
}

export const usePong = (canvasWidth: number, canvasHeight: number) => {
  // Rendering State
  const [gameState, setGameState] = useState<PongState>({
    playerY: canvasHeight / 2 - PADDLE_HEIGHT / 2,
    aiY: canvasHeight / 2 - PADDLE_HEIGHT / 2,
    ballX: canvasWidth / 2,
    ballY: canvasHeight / 2,
    ballDX: INITIAL_BALL_SPEED,
    ballDY: INITIAL_BALL_SPEED,
    playerScore: 0,
    aiScore: 0
  });
  
  const [isGameActive, setIsGameActive] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  // Refs for stable loop
  const stateRef = useRef<PongState>({
    playerY: canvasHeight / 2 - PADDLE_HEIGHT / 2,
    aiY: canvasHeight / 2 - PADDLE_HEIGHT / 2,
    ballX: canvasWidth / 2,
    ballY: canvasHeight / 2,
    ballDX: INITIAL_BALL_SPEED,
    ballDY: INITIAL_BALL_SPEED,
    playerScore: 0,
    aiScore: 0
  });
  
  const isGameActiveRef = useRef(false);
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  const resetBall = useCallback((direction: number) => {
    stateRef.current.ballX = canvasWidth / 2;
    stateRef.current.ballY = canvasHeight / 2;
    stateRef.current.ballDX = INITIAL_BALL_SPEED * direction;
    stateRef.current.ballDY = (Math.random() * 2 - 1) * INITIAL_BALL_SPEED;
  }, [canvasWidth, canvasHeight]);

  const startGame = useCallback(() => {
    stateRef.current = {
      playerY: canvasHeight / 2 - PADDLE_HEIGHT / 2,
      aiY: canvasHeight / 2 - PADDLE_HEIGHT / 2,
      ballX: canvasWidth / 2,
      ballY: canvasHeight / 2,
      ballDX: INITIAL_BALL_SPEED,
      ballDY: (Math.random() * 2 - 1) * INITIAL_BALL_SPEED,
      playerScore: 0,
      aiScore: 0
    };
    setGameState({ ...stateRef.current });
    setIsGameActive(true);
    setIsGameOver(false);
    isGameActiveRef.current = true;
    pongAudio.init();
  }, [canvasHeight, canvasWidth]);

  const movePlayer = useCallback((dy: number) => {
    stateRef.current.playerY = Math.max(0, Math.min(canvasHeight - PADDLE_HEIGHT, stateRef.current.playerY + dy));
  }, [canvasHeight]);

  // Handle Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main Loop
  useEffect(() => {
    let animationFrameId: number;

    const loop = () => {
      if (isGameActiveRef.current) {
        // 1. Move Player
        if (keysPressed.current['ArrowUp'] || keysPressed.current['KeyW']) {
          movePlayer(-PLAYER_SPEED);
        }
        if (keysPressed.current['ArrowDown'] || keysPressed.current['KeyS']) {
          movePlayer(PLAYER_SPEED);
        }

        // 2. Move AI
        const aiCenter = stateRef.current.aiY + PADDLE_HEIGHT / 2;
        if (aiCenter < stateRef.current.ballY - 10) {
          stateRef.current.aiY = Math.min(canvasHeight - PADDLE_HEIGHT, stateRef.current.aiY + AI_SPEED);
        } else if (aiCenter > stateRef.current.ballY + 10) {
          stateRef.current.aiY = Math.max(0, stateRef.current.aiY - AI_SPEED);
        }

        // 3. Move Ball
        stateRef.current.ballX += stateRef.current.ballDX;
        stateRef.current.ballY += stateRef.current.ballDY;

        // 4. Wall Collision (Top/Bottom)
        if (stateRef.current.ballY <= 0 || stateRef.current.ballY >= canvasHeight - BALL_SIZE) {
          stateRef.current.ballDY *= -1;
          pongAudio.playWallHit();
        }

        // 5. Paddle Collision
        // Player Paddle (Left)
        if (stateRef.current.ballX <= PADDLE_WIDTH) {
          if (stateRef.current.ballY + BALL_SIZE >= stateRef.current.playerY && 
              stateRef.current.ballY <= stateRef.current.playerY + PADDLE_HEIGHT) {
            stateRef.current.ballDX = Math.abs(stateRef.current.ballDX) + BALL_SPEED_INCREMENT;
            // Add some spin based on where it hit the paddle
            const deltaY = stateRef.current.ballY + BALL_SIZE / 2 - (stateRef.current.playerY + PADDLE_HEIGHT / 2);
            stateRef.current.ballDY = deltaY * 0.2;
            pongAudio.playPaddleHit();
          } else {
            // Score for AI
            stateRef.current.aiScore += 1;
            pongAudio.playScore();
            if (stateRef.current.aiScore >= 10) {
              setIsGameOver(true);
              setIsGameActive(false);
              isGameActiveRef.current = false;
            } else {
              resetBall(1);
            }
          }
        }

        // AI Paddle (Right)
        if (stateRef.current.ballX >= canvasWidth - PADDLE_WIDTH - BALL_SIZE) {
          if (stateRef.current.ballY + BALL_SIZE >= stateRef.current.aiY && 
              stateRef.current.ballY <= stateRef.current.aiY + PADDLE_HEIGHT) {
            stateRef.current.ballDX = -(Math.abs(stateRef.current.ballDX) + BALL_SPEED_INCREMENT);
            const deltaY = stateRef.current.ballY + BALL_SIZE / 2 - (stateRef.current.aiY + PADDLE_HEIGHT / 2);
            stateRef.current.ballDY = deltaY * 0.2;
            pongAudio.playPaddleHit();
          } else {
            // Score for Player
            stateRef.current.playerScore += 1;
            pongAudio.playScore();
            if (stateRef.current.playerScore >= 10) {
              setIsGameOver(true);
              setIsGameActive(false);
              isGameActiveRef.current = false;
            } else {
              resetBall(-1);
            }
          }
        }

        setGameState({ ...stateRef.current });
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [canvasWidth, canvasHeight, movePlayer, resetBall]);

  return {
    gameState,
    isGameActive,
    isGameOver,
    startGame
  };
};
