import { useState, useRef, useCallback } from 'react';

// --- Constants ---
export const TILE_SIZE = 40;
export const GRAVITY = 0.6;
export const JUMP_FORCE = -14;
export const MOVE_SPEED = 6;
export const FRICTION = 0.85;
export const WORLD_HEIGHT = 600;

// --- Types ---
export type GameState = 'start' | 'playing' | 'gameover' | 'won';

export interface Entity {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  type: 'player' | 'enemy' | 'coin' | 'block' | 'ground' | 'goal';
  color?: string;
  isGrounded?: boolean;
  patrolStart?: number;
  patrolEnd?: number;
  facing?: number; // 1 or -1
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  life: number;
  color: string;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

// --- Level Design ---
// 0: Empty, 1: Ground, 2: Block, 3: Coin, 4: Enemy, 9: Goal
const LEVELS = [
  // Level 1: Basics
  [
    "                                                                                ",
    "                                                                                ",
    "                                                                                ",
    "                                      3 3 3                                     ",
    "                                     2222222                                    ",
    "                                                                                ",
    "                   3 3                                      3 3                 ",
    "                  22222              222                  222222                ",
    "                                                                                ",
    "         3                    4                  4                      9       ",
    "        222       2222222222222222            22222222              22222222    ",
    "                                                                                ",
    "    4          4                                                                ",
    "11111111111111111111111111111111   1111111   11111111111111111111111111111111111",
    "11111111111111111111111111111111   1111111   11111111111111111111111111111111111",
  ],
  // Level 2: Verticality & Gaps
  [
    "                                                                                                    ",
    "                                                                                                    ",
    "                                         333                                                        ",
    "                                        22222                                                       ",
    "                   3                   2222222                                                      ",
    "                  222                 222222222                                         9           ",
    "                                                                                      22222         ",
    "        3                4    4                       3               4              2222222        ",
    "       222              22222222        222       222222222          2222           222222222       ",
    "                                                                                                    ",
    "   4          222                    222                  222                  4                    ",
    "111111     111111111     222      111111111     222    111111111            111111111111111111111111",
    "111111     111111111              111111111            111111111            111111111111111111111111",
  ],
  // Level 3: Enemy Hell
  [
    "                                                                                                                ",
    "                                                                                                                ",
    "                                                                                                                ",
    "                                     3 3 3                                                                      ",
    "                                    2222222                                                                     ",
    "                                                                       4  4  4                                  ",
    "                  4  4                                               22222222222                                ",
    "                22222222            2222222            2222222                                          9       ",
    "                                                                                                      222222    ",
    "         3                    4                  4                  4               4                22222222   ",
    "        222       2222222222222222            22222222          22222222        22222222            2222222222  ",
    "                                                                                                                ",
    "    4          4             4          4             4                                                         ",
    "11111111111111111111   11111111111   11111111111   11111111111   11111111111111111111111111111111111111111111111",
    "11111111111111111111   11111111111   11111111111   11111111111   11111111111111111111111111111111111111111111111",
  ],
  // Level 4: The Dungeon (Tight spaces)
  [
    "                                                                                                                ",
    "                                                                                                                ",
    "                                                                                                                ",
    "                   333                                       333                                                ",
    "                  22222                                     22222                                               ",
    "                                                                                                                ",
    "         2222222222222222222                       2222222222222222222                                          ",
    "                                                                                                                ",
    "    4                            4        4                                  4                         9        ",
    "   222                          222      222                                222                      222222     ",
    "                                                                                                    22222222    ",
    "          22222        22222                       22222        22222                              2222222222   ",
    "                                                                                                                ",
    "    4              4               4         4               4              4                                   ",
    "1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111",
    "1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111",
  ],
  // Level 5: Sky High (Floating platforms)
  [
    "                                                                                                                            ",
    "                                                                                                                            ",
    "                                          333                                     333                                       ",
    "                                         22222                                   22222                                      ",
    "                                                                                                                            ",
    "                   3                                       3                                       3                        ",
    "                  222                 222222222           222                 222222222           222                       ",
    "                                                                                                                            ",
    "                                                                                                                       9    ",
    "        3                4                                       4                                       4            2222  ",
    "       222              222      222      222      222      222      222      222      222      222          222222 ",
    "                                                                                                                    22222222",
    "                                                                                                                            ",
    "11111     222    11111     222    11111      222      11111      222      11111      222      11111               11111111111111",
    "                                                                                                                            ",
  ]
];

export const useSuperBino = () => {
  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);
  const [cameraX, setCameraX] = useState(0);
  const [stage, setStage] = useState(0);
  
  // Refs for game loop state to avoid re-renders
  const playerRef = useRef<Entity>({
    id: 'player',
    x: 100,
    y: 100,
    width: 32,
    height: 32,
    vx: 0,
    vy: 0,
    type: 'player',
    isGrounded: false,
    facing: 1
  });
  
  const entitiesRef = useRef<Entity[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const levelWidthRef = useRef(0);
  const lastFireTimeRef = useRef(0);

  // --- Initialization ---
  const initGame = useCallback((levelIndex: number = 0) => {
    const newEntities: Entity[] = [];
    const levelData = LEVELS[levelIndex] || LEVELS[0];

    levelData.forEach((row, rowIndex) => {
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const char = row[colIndex];
        const x = colIndex * TILE_SIZE;
        const y = rowIndex * TILE_SIZE;

        if (char === '1') {
          newEntities.push({ id: `g-${x}-${y}`, x, y, width: TILE_SIZE, height: TILE_SIZE, vx: 0, vy: 0, type: 'ground' });
        } else if (char === '2') {
          newEntities.push({ id: `b-${x}-${y}`, x, y, width: TILE_SIZE, height: TILE_SIZE, vx: 0, vy: 0, type: 'block' });
        } else if (char === '3') {
          newEntities.push({ id: `c-${x}-${y}`, x: x + 10, y: y + 10, width: 20, height: 20, vx: 0, vy: 0, type: 'coin' });
        } else if (char === '4') {
          newEntities.push({ 
            id: `e-${x}-${y}`, 
            x, 
            y, 
            width: 32, 
            height: 32, 
            vx: 2, 
            vy: 0, 
            type: 'enemy',
            patrolStart: x - 100,
            patrolEnd: x + 100
          });
        } else if (char === '9') {
          newEntities.push({ id: `win-${x}-${y}`, x, y, width: TILE_SIZE, height: TILE_SIZE * 2, vx: 0, vy: 0, type: 'goal' });
        }
      }
    });

    levelWidthRef.current = levelData[0].length * TILE_SIZE;
    entitiesRef.current = newEntities;
    playerRef.current = {
      id: 'player',
      x: 100,
      y: 300,
      width: 30,
      height: 30,
      vx: 0,
      vy: 0,
      type: 'player',
      isGrounded: false,
      facing: 1
    };
    particlesRef.current = [];
    projectilesRef.current = [];
    setScore(prev => levelIndex === 0 ? 0 : prev); // Reset score only on first level
    setCameraX(0);
    setStage(levelIndex);
    setGameState('playing');
  }, []);

  // --- Physics Helpers ---
  const checkCollision = (rect1: {x: number, y: number, width: number, height: number}, rect2: {x: number, y: number, width: number, height: number}) => {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  };

  const createParticles = (x: number, y: number, color: string, count: number = 5) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        id: Math.random().toString(),
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1.0,
        color
      });
    }
  };

  const fireProjectile = useCallback(() => {
    const now = Date.now();
    if (now - lastFireTimeRef.current < 400) return; // Cooldown
    lastFireTimeRef.current = now;

    const p = playerRef.current;
    const facing = p.facing || 1;
    
    projectilesRef.current.push({
      id: Math.random().toString(),
      x: p.x + (facing === 1 ? p.width : -10),
      y: p.y + p.height / 2 - 5,
      vx: facing * 10,
      vy: 0,
      width: 10,
      height: 10,
      life: 1.0,
      color: '#ef4444' // Red bomb
    });
  }, []);

  // --- Game Loop ---
  const update = useCallback(() => {
    if (gameState !== 'playing') return;

    const player = playerRef.current;
    const entities = entitiesRef.current;

    // 1. Player Movement
    if (keysRef.current['ArrowRight'] || keysRef.current['d']) {
      player.vx += 1;
      player.facing = 1;
    }
    if (keysRef.current['ArrowLeft'] || keysRef.current['a']) {
      player.vx -= 1;
      player.facing = -1;
    }
    if ((keysRef.current['ArrowUp'] || keysRef.current['w'] || keysRef.current[' ']) && player.isGrounded) {
      player.vy = JUMP_FORCE;
      player.isGrounded = false;
      createParticles(player.x + player.width/2, player.y + player.height, '#fff', 3);
    }
    
    // Fire check
    if (keysRef.current['f'] || keysRef.current['F']) {
      fireProjectile();
    }

    // Apply Physics to Player
    player.vx *= FRICTION;
    player.vy += GRAVITY;
    player.vx = Math.max(Math.min(player.vx, MOVE_SPEED), -MOVE_SPEED);

    // Horizontal Collision
    player.x += player.vx;
    for (const ent of entities) {
      if ((ent.type === 'ground' || ent.type === 'block') && checkCollision(player, ent)) {
        if (player.vx > 0) player.x = ent.x - player.width;
        else if (player.vx < 0) player.x = ent.x + ent.width;
        player.vx = 0;
      }
    }

    // Vertical Collision
    player.y += player.vy;
    player.isGrounded = false;
    for (let i = entities.length - 1; i >= 0; i--) {
      const ent = entities[i];
      if ((ent.type === 'ground' || ent.type === 'block') && checkCollision(player, ent)) {
        if (player.vy > 0) {
          player.y = ent.y - player.height;
          player.isGrounded = true;
          player.vy = 0;
        } else if (player.vy < 0) {
          player.y = ent.y + ent.height;
          player.vy = 0;
          
          // Break block logic
          if (ent.type === 'block') {
            createParticles(ent.x + ent.width/2, ent.y + ent.height/2, '#64748b', 6);
            entities.splice(i, 1);
            setScore(s => s + 10);
          }
        }
      }
    }

    // World Bounds
    if (player.y > WORLD_HEIGHT) {
      setGameState('gameover');
    }
    if (player.x < 0) player.x = 0;

    // Projectiles Logic
    for (let i = projectilesRef.current.length - 1; i >= 0; i--) {
      const proj = projectilesRef.current[i];
      proj.x += proj.vx;
      proj.y += proj.vy; // Should projectiles have gravity? Maybe slight arc
      proj.vy += 0.2; // Gravity for bombs
      
      // Trail Effect
      if (Math.random() < 0.3) {
         createParticles(proj.x, proj.y, '#fca5a5', 1);
      }

      // Ground/Wall Collision
      let hit = false;
      for (const ent of entities) {
        if ((ent.type === 'ground' || ent.type === 'block') && checkCollision(proj, ent)) {
           hit = true;
           break;
        }
      }
      
      if (hit || proj.y > WORLD_HEIGHT) {
        createParticles(proj.x, proj.y, '#fca5a5', 3);
        projectilesRef.current.splice(i, 1);
        continue;
      }

      // Enemy Collision
      for (let j = entities.length - 1; j >= 0; j--) {
        const ent = entities[j];
        if (ent.type === 'enemy' && checkCollision(proj, ent)) {
          createParticles(ent.x + ent.width/2, ent.y + ent.height/2, '#ff0000', 8);
          entities.splice(j, 1); // Kill enemy
          projectilesRef.current.splice(i, 1); // Remove bomb
          setScore(s => s + 100);
          hit = true;
          break;
        }
      }
    }

    // Entity Interactions (Coins, Enemies, Goal)
    for (let i = entities.length - 1; i >= 0; i--) {
      const ent = entities[i];
      
      // Enemy Logic
      if (ent.type === 'enemy') {
        ent.vy += GRAVITY;
        ent.y += ent.vy; // Simple gravity for enemies
        
        // Ground check for enemy
        for (const ground of entities) {
          if ((ground.type === 'ground' || ground.type === 'block') && checkCollision(ent, ground)) {
             if (ent.vy > 0) {
               ent.y = ground.y - ent.height;
               ent.vy = 0;
             }
          }
        }
        
        ent.x += ent.vx;
        // Turn around at patrol limits or walls
        if (ent.patrolStart !== undefined && ent.patrolEnd !== undefined) {
           if (ent.x < ent.patrolStart || ent.x > ent.patrolEnd) ent.vx *= -1;
        }
        
        // Check collision with player
        if (checkCollision(player, ent)) {
          // Stomp check: Player falling and above enemy
          if (player.vy > 0 && player.y + player.height < ent.y + ent.height / 2) {
             // Kill enemy
             createParticles(ent.x + ent.width/2, ent.y + ent.height/2, '#ff0000');
             entities.splice(i, 1);
             player.vy = JUMP_FORCE * 0.5; // Bounce
             setScore(s => s + 100);
          } else {
             // Kill player
             setGameState('gameover');
          }
        }
      }

      // Coin Logic
      if (ent.type === 'coin') {
        if (checkCollision(player, ent)) {
          createParticles(ent.x + ent.width/2, ent.y + ent.height/2, '#ffd700');
          entities.splice(i, 1);
          setScore(s => s + 50);
        }
      }

      // Goal Logic
      if (ent.type === 'goal') {
        if (checkCollision(player, ent)) {
          if (stage < LEVELS.length - 1) {
            // Next Level
            initGame(stage + 1);
          } else {
            // Win
            setGameState('won');
          }
        }
      }
    }

    // Particles Update
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.05;
      if (p.life <= 0) particlesRef.current.splice(i, 1);
    }

    // Camera Follow
    // Keep player in middle 1/3 of screen
    const targetCamX = player.x - 400; // 400 is half of 800 width (approx)
    const maxCamX = levelWidthRef.current - 800;
    const clampedCamX = Math.max(0, Math.min(targetCamX, maxCamX));
    // Smooth camera
    setCameraX(prev => prev + (clampedCamX - prev) * 0.1);

  }, [gameState, stage, initGame, fireProjectile]);

  // --- Input Handlers ---
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keysRef.current[e.key] = true;
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysRef.current[e.key] = false;
  }, []);

  // --- External Controls ---
  const jump = useCallback(() => {
    if (playerRef.current.isGrounded) {
       keysRef.current[' '] = true;
       // Auto-release after a frame logic handled in loop or just manual toggle
       setTimeout(() => keysRef.current[' '] = false, 100);
    }
  }, []);
  
  const moveLeft = useCallback((start: boolean) => {
    keysRef.current['ArrowLeft'] = start;
  }, []);

  const moveRight = useCallback((start: boolean) => {
    keysRef.current['ArrowRight'] = start;
  }, []);

  const fire = useCallback(() => {
    keysRef.current['f'] = true;
    setTimeout(() => keysRef.current['f'] = false, 100);
  }, []);

  return {
    gameState,
    score,
    cameraX,
    stage,
    playerRef,
    entitiesRef,
    particlesRef,
    projectilesRef,
    initGame,
    update,
    handleKeyDown,
    handleKeyUp,
    controls: { jump, moveLeft, moveRight, fire }
  };
};
