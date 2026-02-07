import { useState, useCallback, useRef, useEffect } from 'react';

export const BUBBLE_RADIUS = 18;
export const GRID_COLS = 10;
export const GRID_ROWS = 12;
export const WORLD_WIDTH = GRID_COLS * BUBBLE_RADIUS * 2 + BUBBLE_RADIUS;
export const WORLD_HEIGHT = 580;
export const SHOOTER_Y = WORLD_HEIGHT - 40;

export type BubbleColor = 'cyan' | 'magenta' | 'yellow' | 'lime' | 'orange' | 'purple';
export const COLORS: BubbleColor[] = ['cyan', 'magenta', 'yellow', 'lime', 'orange', 'purple'];

export interface Bubble {
  x: number;
  y: number;
  color: BubbleColor;
  id: string;
  row: number;
  col: number;
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: BubbleColor;
}

export type GameState = 'idle' | 'playing' | 'gameover' | 'levelclear';

const MIN_AIM_ANGLE = -Math.PI + 0.18;
const MAX_AIM_ANGLE = -0.18;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function randomFrom<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export function useBubbleShooter() {
  const [grid, setGrid] = useState<(Bubble | null)[][]>([]);
  const [shooterColor, setShooterColor] = useState<BubbleColor>(COLORS[0]);
  const [nextColor, setNextColor] = useState<BubbleColor>(COLORS[1]);
  const [projectile, setProjectile] = useState<Projectile | null>(null);
  const [gameState, setGameState] = useState<GameState>('idle');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [angle, setAngle] = useState(-Math.PI / 2);
  
  const [bubblesRemaining, setBubblesRemaining] = useState(0);
  
  const gridRef = useRef<(Bubble | null)[][]>([]);
  const projectileRef = useRef<Projectile | null>(null);
  const particlesRef = useRef<{x: number, y: number, vx: number, vy: number, color: string, life: number}[]>([]);
  const levelRef = useRef(1);
  const bubblesRemainingRef = useRef(0);

  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  const getCellCenter = useCallback((r: number, c: number) => {
    const x = c * BUBBLE_RADIUS * 2 + (r % 2 === 1 ? BUBBLE_RADIUS : 0) + BUBBLE_RADIUS;
    const y = r * BUBBLE_RADIUS * 2 + BUBBLE_RADIUS;
    return { x, y };
  }, []);

  const getColorsInGrid = useCallback((g: (Bubble | null)[][]) => {
    const set = new Set<BubbleColor>();
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const b = g[r]?.[c];
        if (b) set.add(b.color);
      }
    }
    return Array.from(set);
  }, []);

  const buildLevelGrid = useCallback((lvl: number) => {
    const startRows = Math.min(4 + Math.floor((lvl - 1) / 2), 8);
    const paletteSize = Math.min(3 + Math.floor((lvl - 1) / 2), COLORS.length);
    const palette = COLORS.slice(0, paletteSize);

    const newGrid: (Bubble | null)[][] = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      newGrid[r] = [];
      for (let c = 0; c < GRID_COLS; c++) {
        if (r < startRows) {
          const { x, y } = getCellCenter(r, c);
          newGrid[r][c] = {
            x,
            y,
            color: randomFrom(palette),
            id: Math.random().toString(36).slice(2, 11),
            row: r,
            col: c,
          };
        } else {
          newGrid[r][c] = null;
        }
      }
    }

    return { newGrid, palette };
  }, [getCellCenter]);

  const startLevel = useCallback((lvl: number, resetScore: boolean) => {
    const { newGrid, palette } = buildLevelGrid(lvl);
    setGrid(newGrid);
    gridRef.current = newGrid;
    particlesRef.current = [];
    projectileRef.current = null;
    setProjectile(null);

    const colorsInPlay = getColorsInGrid(newGrid);
    const usable = colorsInPlay.length > 0 ? colorsInPlay : palette;
    setShooterColor(randomFrom(usable));
    setNextColor(randomFrom(usable));
    setAngle(-Math.PI / 2);
    
    // Calculate ammo based on grid complexity
    let bubbleCount = 0;
    for(let r=0; r<GRID_ROWS; r++) {
      for(let c=0; c<GRID_COLS; c++) {
        if(newGrid[r][c]) bubbleCount++;
      }
    }
    // Give user 50% more bubbles than targets plus a base buffer that decreases slightly with level
    // But ensures enough to win.
    const ammo = Math.floor(bubbleCount * 1.5) + 15;
    
    setBubblesRemaining(ammo);
    bubblesRemainingRef.current = ammo;
    
    setLevel(lvl);
    levelRef.current = lvl;
    if (resetScore) setScore(0);
    setGameState('playing');
  }, [buildLevelGrid, getColorsInGrid]);

  const initGrid = useCallback(() => {
    startLevel(1, true);
  }, [startLevel]);

  const advanceLevel = useCallback(() => {
    startLevel(levelRef.current + 1, false);
  }, [startLevel]);

  const shoot = useCallback((aimAngle?: number) => {
    if (projectileRef.current || gameState !== 'playing') return;
    if (bubblesRemainingRef.current <= 0) return; // Should be handled by gameover check, but safety

    const speed = 12;
    const finalAngle = clamp(typeof aimAngle === 'number' ? aimAngle : angle, MIN_AIM_ANGLE, MAX_AIM_ANGLE);
    const vx = Math.cos(finalAngle) * speed;
    const vy = Math.sin(finalAngle) * speed;

    const p: Projectile = {
      x: WORLD_WIDTH / 2,
      y: SHOOTER_Y,
      vx,
      vy,
      color: shooterColor
    };
    projectileRef.current = p;
    setProjectile(p);

    // Decrement ammo
    bubblesRemainingRef.current -= 1;
    setBubblesRemaining(bubblesRemainingRef.current);

    setShooterColor(nextColor);
    const colorsInPlay = getColorsInGrid(gridRef.current);
    const usable = colorsInPlay.length > 0 ? colorsInPlay : COLORS;
    setNextColor(randomFrom(usable));
    setAngle(finalAngle);
  }, [angle, shooterColor, nextColor, gameState, getColorsInGrid]);

  const getNeighbors = useCallback((row: number, col: number) => {
    const neighbors: {r: number, c: number}[] = [];
    const isOdd = row % 2 === 1;

    const dirs = isOdd 
      ? [[0, -1], [0, 1], [-1, 0], [-1, 1], [1, 0], [1, 1]]
      : [[0, -1], [0, 1], [-1, -1], [-1, 0], [1, -1], [1, 0]];

    for (const [dr, dc] of dirs) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < GRID_ROWS && nc >= 0 && nc < GRID_COLS) {
        neighbors.push({r: nr, c: nc});
      }
    }
    return neighbors;
  }, []);

  const findCluster = useCallback((row: number, col: number, color: BubbleColor) => {
    const cluster: {r: number, c: number}[] = [];
    const queue: {r: number, c: number}[] = [{r: row, c: col}];
    const visited = new Set<string>();
    visited.add(`${row},${col}`);

    while (queue.length > 0) {
      const {r, c} = queue.shift()!;
      const bubble = gridRef.current[r][c];
      
      if (bubble && bubble.color === color) {
        cluster.push({r, c});
        const neighbors = getNeighbors(r, c);
        for (const nb of neighbors) {
          const key = `${nb.r},${nb.c}`;
          if (!visited.has(key)) {
            visited.add(key);
            queue.push(nb);
          }
        }
      }
    }
    return cluster;
  }, [getNeighbors]);

  const findFloating = useCallback(() => {
    const connected = new Set<string>();
    const queue: {r: number, c: number}[] = [];

    for (let c = 0; c < GRID_COLS; c++) {
      if (gridRef.current[0][c]) {
        queue.push({r: 0, c: c});
        connected.add(`0,${c}`);
      }
    }

    while (queue.length > 0) {
      const {r, c} = queue.shift()!;
      const neighbors = getNeighbors(r, c);
      for (const nb of neighbors) {
        const key = `${nb.r},${nb.c}`;
        if (!connected.has(key) && gridRef.current[nb.r][nb.c]) {
          connected.add(key);
          queue.push(nb);
        }
      }
    }

    const floating: {r: number, c: number}[] = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (gridRef.current[r][c] && !connected.has(`${r},${c}`)) {
          floating.push({r, c});
        }
      }
    }
    return floating;
  }, [getNeighbors]);

  const snapToGrid = useCallback((x: number, y: number) => {
    let bestDist = Infinity;
    let bestPos = {r: 0, c: 0};

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (!gridRef.current[r][c]) {
          const { x: bx, y: by } = getCellCenter(r, c);
          const dist = Math.hypot(x - bx, y - by);
          if (dist < bestDist) {
            bestDist = dist;
            bestPos = {r, c};
          }
        }
      }
    }
    return bestPos;
  }, [getCellCenter]);

  const createPopParticles = useCallback((x: number, y: number, color: string) => {
    for (let i = 0; i < 8; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        color,
        life: 1.0,
      });
    }
  }, []);

  const handleCollision = useCallback((r: number, c: number, color: BubbleColor) => {
    const newGrid = [...gridRef.current.map(row => [...row])];
    const { x, y } = getCellCenter(r, c);
    
    newGrid[r][c] = {
      x, y, color,
      id: Math.random().toString(36).slice(2, 11),
      row: r, col: c
    };
    gridRef.current = newGrid;

    const cluster = findCluster(r, c, color);
    if (cluster.length >= 3) {
      // Pop cluster
      for (const pos of cluster) {
        const b = newGrid[pos.r][pos.c];
        if (b) createPopParticles(b.x, b.y, b.color);
        newGrid[pos.r][pos.c] = null;
      }
      
      // Find and pop floating bubbles
      gridRef.current = newGrid;
      const floating = findFloating();
      for (const pos of floating) {
        const b = newGrid[pos.r][pos.c];
        if (b) createPopParticles(b.x, b.y, b.color);
        newGrid[pos.r][pos.c] = null;
      }

      setScore(s => s + cluster.length * 10 + floating.length * 20);
    }

    const remainingColors = getColorsInGrid(newGrid);
    if (remainingColors.length === 0) {
      setGrid(newGrid);
      gridRef.current = newGrid;
      setGameState('levelclear');
      return;
    }
    
    // Check game over conditions
    // 1. Out of ammo
    if (bubblesRemainingRef.current <= 0) {
      setGrid(newGrid);
      gridRef.current = newGrid;
      setGameState('gameover');
      return;
    }

    // 2. Bubbles reached bottom
    if (r >= GRID_ROWS - 1) {
      setGrid(newGrid);
      gridRef.current = newGrid;
      setGameState('gameover');
      return;
    }

    setShooterColor(prev => (remainingColors.includes(prev) ? prev : randomFrom(remainingColors)));
    setNextColor(prev => (remainingColors.includes(prev) ? prev : randomFrom(remainingColors)));

    setGrid(newGrid);
    gridRef.current = newGrid;
  }, [createPopParticles, findCluster, findFloating, getCellCenter, getColorsInGrid]);

  const tick = useCallback((dt: number) => {
    const scale = dt / (1000 / 60);
    const current = projectileRef.current;
    if (current) {
      let nx = current.x + current.vx * scale;
      const ny = current.y + current.vy * scale;
      let nvx = current.vx;
      const nvy = current.vy;

      if (nx < BUBBLE_RADIUS || nx > WORLD_WIDTH - BUBBLE_RADIUS) {
        nvx = -nvx;
        nx = nx < BUBBLE_RADIUS ? BUBBLE_RADIUS : WORLD_WIDTH - BUBBLE_RADIUS;
      }

      if (ny < BUBBLE_RADIUS) {
        const { r, c } = snapToGrid(nx, ny);
        handleCollision(r, c, current.color);
        projectileRef.current = null;
        setProjectile(null);
      } else {
        let collided = false;
        for (let r = 0; r < GRID_ROWS && !collided; r++) {
          for (let c = 0; c < GRID_COLS; c++) {
            const bubble = gridRef.current[r][c];
            if (bubble) {
              const dist = Math.hypot(nx - bubble.x, ny - bubble.y);
              if (dist < BUBBLE_RADIUS * 2 - 2) {
                const { r: nr, c: nc } = snapToGrid(nx, ny);
                handleCollision(nr, nc, current.color);
                collided = true;
                break;
              }
            }
          }
        }

        if (collided || ny > WORLD_HEIGHT) {
          projectileRef.current = null;
          setProjectile(null);
        } else {
          const nextP: Projectile = { ...current, x: nx, y: ny, vx: nvx, vy: nvy };
          projectileRef.current = nextP;
          setProjectile(nextP);
        }
      }
    }

    const arr = particlesRef.current;
    let write = 0;
    for (let i = 0; i < arr.length; i++) {
      const p = arr[i];
      p.x += p.vx * scale;
      p.y += p.vy * scale;
      p.life -= 0.05 * scale;
      if (p.life > 0) {
        arr[write] = p;
        write += 1;
      }
    }
    arr.length = write;
  }, [handleCollision, snapToGrid]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    let rafId = 0;
    let last = performance.now();

    const frame = (t: number) => {
      const dt = Math.min(48, t - last);
      last = t;
      tick(dt);
      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [gameState, tick]);

  return {
    grid,
    shooterColor,
    nextColor,
    projectile,
    gameState,
    score,
    level,
    angle,
    setAngle,
    shoot,
    initGrid,
    advanceLevel,
    bubblesRemaining,
    particlesRef
  };
} 
