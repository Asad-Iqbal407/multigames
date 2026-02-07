"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { carAudio } from '../utils/carAudio';

export const ROAD_WIDTH = 420;
export const ROAD_HEIGHT = 520;
export const CAR_WIDTH = 40;
export const CAR_HEIGHT = 70;
const INITIAL_SPEED = 5;
const MIN_SPEED = 3;
const MAX_SPEED = 15;
const ROAD_EDGE_PADDING = 28;

interface Obstacle {
  id: number;
  x: number;
  y: number;
  laneIndex: 0 | 1 | 2;
  type: 'car' | 'pothole';
  color: string;
  speed: number;
  passed: boolean;
}

export const useCarRacing = () => {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'mission' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('carHighScore');
      return saved ? parseInt(saved) : 0;
    }
    return 0;
  });
  const [mission, setMission] = useState(1);
  const [missionTarget, setMissionTarget] = useState(10);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [curve, setCurve] = useState(0);
  const [playerX, setPlayerX] = useState(ROAD_WIDTH / 2 - CAR_WIDTH / 2);
  const [playerY, setPlayerY] = useState(ROAD_HEIGHT - CAR_HEIGHT - 20);
  const [playerZ, setPlayerZ] = useState(0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  
  const gameLoopRef = useRef<number | null>(null);
  const speedRef = useRef(INITIAL_SPEED);
  const speedTickRef = useRef(0);
  const desiredSpeedRef = useRef(INITIAL_SPEED);
  const curveRef = useRef(0);
  const curveTargetRef = useRef(0);
  const curveTickRef = useRef(0);
  const lastCurveChangeRef = useRef(0);
  const missionRef = useRef(1);
  const missionTargetRef = useRef(10);
  const missionCompleteRef = useRef(false);
  const scoreRef = useRef(0);
  const playerXRef = useRef(ROAD_WIDTH / 2 - CAR_WIDTH / 2);
  const playerYRef = useRef(ROAD_HEIGHT - CAR_HEIGHT - 20);
  const playerZRef = useRef(0);
  const jumpVelocityRef = useRef(0);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const lastObstacleTimeRef = useRef(0);
  const lastSpawnTimeByLaneRef = useRef<[number, number, number]>([0, 0, 0]);
  const touchStartRef = useRef<{ x: number, y: number } | null>(null);

  const jump = useCallback(() => {
    if (gameState !== 'playing' || playerZRef.current > 0) return;
    jumpVelocityRef.current = 15;
  }, [gameState]);

  const getRoadOffsetAtY = useCallback((y: number) => {
    const t = Math.max(0, Math.min(1, y / ROAD_HEIGHT));
    return curveRef.current * t * 95;
  }, []);

  const getLaneX = useCallback((laneIndex: 0 | 1 | 2, y: number) => {
    const roadPadding = 30;
    const innerWidth = ROAD_WIDTH - roadPadding * 2;
    const laneWidth = innerWidth / 3;
    const centerX = roadPadding + laneWidth * (laneIndex + 0.5) - CAR_WIDTH / 2;
    return centerX + getRoadOffsetAtY(y);
  }, [getRoadOffsetAtY]);

  const getMissionTargetFor = useCallback((missionNumber: number) => {
    return 10 + (missionNumber - 1) * 5;
  }, []);

  useEffect(() => {
    missionRef.current = mission;
    missionTargetRef.current = missionTarget;
  }, [mission, missionTarget]);

  const spawnObstacle = useCallback(() => {
    const carsInView = obstaclesRef.current.filter(
      o => o.type === 'car' && o.y > -CAR_HEIGHT * 4 && o.y < ROAD_HEIGHT + CAR_HEIGHT * 3
    ).length;
    const maxCarsInView = Math.min(4, 2 + Math.floor(missionRef.current / 2));
    if (carsInView >= maxCarsInView) return;

    const laneCooldownMs = Math.max(850, 1400 - missionRef.current * 60);
    const now = Date.now();

    const laneOrder: Array<0 | 1 | 2> = [0, 1, 2].sort(() => Math.random() - 0.5) as Array<0 | 1 | 2>;
    const spawnY = -CAR_HEIGHT - 40 - Math.random() * 80;
    let chosenLane: 0 | 1 | 2 | null = null;

    for (const lane of laneOrder) {
      if (now - lastSpawnTimeByLaneRef.current[lane] < laneCooldownMs) continue;
      const topLaneCar = obstaclesRef.current
        .filter(o => o.type === 'car' && o.laneIndex === lane)
        .reduce<number | null>((minY, o) => (minY === null ? o.y : Math.min(minY, o.y)), null);
      if (topLaneCar !== null && topLaneCar < 120) continue;
      chosenLane = lane;
      break;
    }

    if (chosenLane === null) return;

    const laneIndex = chosenLane;
    const x = getLaneX(laneIndex, spawnY);
    
    const colors = ['#ff00ff', '#00ffff', '#ffff00', '#ff0000'];
    const type: Obstacle["type"] = Math.random() > 0.1 ? 'car' : 'pothole';
    const trafficBase = Math.max(MIN_SPEED, Math.min(MAX_SPEED - 1, desiredSpeedRef.current - 1.0));
    const trafficSpeed = Math.max(MIN_SPEED, trafficBase - (0.8 + Math.random() * 2.2));

    const newObstacle: Obstacle = {
      id: Date.now(),
      x,
      y: spawnY,
      laneIndex,
      type,
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: type === 'car' ? trafficSpeed : 0,
      passed: false
    };
    
    lastSpawnTimeByLaneRef.current[laneIndex] = now;
    obstaclesRef.current = [...obstaclesRef.current, newObstacle];
  }, [getLaneX]);

  const gameOver = useCallback(() => {
    setGameState('gameover');
    carAudio.stopEngine();
    carAudio.playCrash();
    
    const finalScore = scoreRef.current;
    setHighScore(prev => {
      if (finalScore > prev) {
        localStorage.setItem('carHighScore', finalScore.toString());
        return finalScore;
      }
      return prev;
    });
    
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
  }, []);

  const updateLogicRef = useRef<() => void>(() => {});

  useEffect(() => {
    updateLogicRef.current = () => {
      if (gameState !== 'playing') return;

      speedRef.current += (desiredSpeedRef.current - speedRef.current) * 0.06;
      speedRef.current = Math.max(MIN_SPEED, Math.min(MAX_SPEED, speedRef.current));
      carAudio.updateEngine(speedRef.current);
      speedTickRef.current += 1;
      if (speedTickRef.current % 6 === 0) {
        setSpeed(Number(speedRef.current.toFixed(2)));
      }

      const nowPerf = performance.now();
      const curveAggression = Math.min(0.98, 0.45 + missionRef.current * 0.1);
      if (nowPerf - lastCurveChangeRef.current > 1700 - speedRef.current * 40 - missionRef.current * 70) {
        curveTargetRef.current = (Math.random() * 2 - 1) * curveAggression;
        lastCurveChangeRef.current = nowPerf;
      }
      curveRef.current += (curveTargetRef.current - curveRef.current) * 0.012;
      curveTickRef.current += 1;
      if (curveTickRef.current % 6 === 0) {
        setCurve(Number(curveRef.current.toFixed(3)));
      }

      {
        const offset = getRoadOffsetAtY(playerYRef.current);
        const leftEdge = Math.max(0, ROAD_EDGE_PADDING + offset);
        const rightEdge = Math.min(ROAD_WIDTH, ROAD_WIDTH - ROAD_EDGE_PADDING + offset);
        const maxX = Math.max(leftEdge, rightEdge - CAR_WIDTH);
        const clampedX = Math.max(leftEdge, Math.min(maxX, playerXRef.current));
        if (clampedX !== playerXRef.current) {
          playerXRef.current = clampedX;
          setPlayerX(clampedX);
        }
      }

      if (playerZRef.current > 0 || jumpVelocityRef.current !== 0) {
        playerZRef.current += jumpVelocityRef.current;
        jumpVelocityRef.current -= 1.5;
        
        if (playerZRef.current <= 0) {
          playerZRef.current = 0;
          jumpVelocityRef.current = 0;
        }
        setPlayerZ(playerZRef.current);
      }

      const now = Date.now();
      const spawnEvery = Math.max(900, 1850 - (speedRef.current * 35) - missionRef.current * 70);
      if (now - lastObstacleTimeRef.current > spawnEvery) {
        spawnObstacle();
        lastObstacleTimeRef.current = now;
      }

      const updatedObstacles = obstaclesRef.current
        .map(obs => {
          const relativeSpeed = obs.type === 'car' ? (speedRef.current - obs.speed) : speedRef.current;
          const newY = obs.y + relativeSpeed;
          const passed = obs.passed || (obs.type === 'car' && newY > playerYRef.current + CAR_HEIGHT);

          if (!missionCompleteRef.current && !obs.passed && passed && obs.type === 'car') {
            scoreRef.current += 1;
            setScore(scoreRef.current);
            if (!missionCompleteRef.current && scoreRef.current >= missionTargetRef.current) {
              missionCompleteRef.current = true;
              setGameState('mission');
              carAudio.stopEngine();
              carAudio.playScore();
            }
          }

          return { ...obs, y: newY, x: getLaneX(obs.laneIndex, newY), passed };
        })
        .filter(obs => obs.y < ROAD_HEIGHT + 200 && obs.y > -200);

      if (missionCompleteRef.current) {
        obstaclesRef.current = updatedObstacles;
        setObstacles(updatedObstacles);
        return;
      }

      for (const obs of updatedObstacles) {
        const margin = 5;
        const isAirborne = playerZRef.current > 40;
        
        if (
          !isAirborne &&
          obs.type === 'car' &&
          playerXRef.current < obs.x + CAR_WIDTH - margin &&
          playerXRef.current + CAR_WIDTH > obs.x + margin &&
          playerYRef.current < obs.y + CAR_HEIGHT - margin &&
          playerYRef.current + CAR_HEIGHT > obs.y + margin
        ) {
          gameOver();
          return;
        }

        if (
          !isAirborne &&
          obs.type === 'pothole' &&
          playerXRef.current < obs.x + CAR_WIDTH - margin &&
          playerXRef.current + CAR_WIDTH > obs.x + margin &&
          playerYRef.current < obs.y + CAR_HEIGHT - margin &&
          playerYRef.current + CAR_HEIGHT > obs.y + margin
        ) {
          desiredSpeedRef.current = Math.max(MIN_SPEED, desiredSpeedRef.current - 1.6);
          setSpeed(Number(desiredSpeedRef.current.toFixed(2)));
        }
      }

      obstaclesRef.current = updatedObstacles;
      setObstacles(updatedObstacles);
      gameLoopRef.current = requestAnimationFrame(updateLogicRef.current);
    };
  }, [gameState, spawnObstacle, gameOver, getLaneX, getRoadOffsetAtY]);

  useEffect(() => {
    if (gameState !== 'mission') return;
    const nextMission = missionRef.current + 1;
    const t = setTimeout(() => {
      setMission(nextMission);
      const nextTarget = getMissionTargetFor(nextMission);
      setMissionTarget(nextTarget);
      setGameState('playing');
      setScore(0);
      scoreRef.current = 0;
      missionCompleteRef.current = false;
      obstaclesRef.current = [];
      setObstacles([]);
      lastObstacleTimeRef.current = Date.now();
      carAudio.startEngine();
    }, 1200);
    return () => clearTimeout(t);
  }, [gameState, getMissionTargetFor]);

  const startGame = useCallback(() => {
    setGameState('playing');
    setScore(0);
    scoreRef.current = 0;
    setMission(1);
    setMissionTarget(getMissionTargetFor(1));
    missionCompleteRef.current = false;
    speedRef.current = INITIAL_SPEED;
    speedTickRef.current = 0;
    desiredSpeedRef.current = INITIAL_SPEED;
    setSpeed(INITIAL_SPEED);
    curveRef.current = 0;
    curveTargetRef.current = 0;
    curveTickRef.current = 0;
    lastCurveChangeRef.current = performance.now();
    setCurve(0);
    obstaclesRef.current = [];
    setObstacles([]);
    lastSpawnTimeByLaneRef.current = [0, 0, 0];
    playerXRef.current = ROAD_WIDTH / 2 - CAR_WIDTH / 2;
    playerYRef.current = ROAD_HEIGHT - CAR_HEIGHT - 20;
    playerZRef.current = 0;
    jumpVelocityRef.current = 0;
    setPlayerX(playerXRef.current);
    setPlayerY(playerYRef.current);
    setPlayerZ(0);
    lastObstacleTimeRef.current = Date.now();
    carAudio.startEngine();
  }, [getMissionTargetFor]);

  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = requestAnimationFrame(updateLogicRef.current);
    }
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      if (gameState !== 'playing') {
        carAudio.stopEngine();
      }
    };
  }, [gameState]);

  useEffect(() => {
    return () => {
      carAudio.stopEngine();
    };
  }, []);

  const movePlayer = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    if (gameState !== 'playing') return;
    const step = 20;
    
    if (direction === 'left' || direction === 'right') {
      let newX = playerXRef.current + (direction === 'left' ? -step : step);
      const offset = getRoadOffsetAtY(playerYRef.current);
      const leftEdge = Math.max(0, ROAD_EDGE_PADDING + offset);
      const rightEdge = Math.min(ROAD_WIDTH, ROAD_WIDTH - ROAD_EDGE_PADDING + offset);
      const maxX = Math.max(leftEdge, rightEdge - CAR_WIDTH);
      newX = Math.max(leftEdge, Math.min(maxX, newX));
      playerXRef.current = newX;
      setPlayerX(newX);
    } else {
      let newY = playerYRef.current + (direction === 'up' ? -step : step);
      newY = Math.max(0, Math.min(ROAD_HEIGHT - CAR_HEIGHT, newY));
      playerYRef.current = newY;
      setPlayerY(newY);
    }
  }, [gameState, getRoadOffsetAtY]);

  const changeSpeed = useCallback((delta: number) => {
    if (gameState !== 'playing') return;
    desiredSpeedRef.current = Math.max(MIN_SPEED, Math.min(MAX_SPEED, desiredSpeedRef.current + delta));
    setSpeed(Number(desiredSpeedRef.current.toFixed(2)));
  }, [gameState]);

  const accelerate = useCallback(() => changeSpeed(0.8), [changeSpeed]);
  const brake = useCallback(() => changeSpeed(-1.0), [changeSpeed]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || gameState !== 'playing') return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > 10) {
        movePlayer(deltaX > 0 ? 'right' : 'left');
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      }
    } else {
      if (Math.abs(deltaY) > 10) {
        movePlayer(deltaY > 0 ? 'down' : 'up');
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      }
    }
  };

  return {
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
  };
};
