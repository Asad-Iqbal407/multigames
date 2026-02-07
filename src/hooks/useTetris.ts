"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { TETROMINOES, randomTetromino, TetrominoShape } from '../utils/tetrominoes';
import { tetrisAudio } from '../utils/tetrisAudio';

export const STAGE_WIDTH = 10;
export const STAGE_HEIGHT = 20;

type Cell = [string | number, string]; // [type, state] e.g. [0, 'clear'] or ['J', 'merged']
export type Stage = Cell[][];
type Player = {
  pos: { x: number; y: number };
  tetromino: TetrominoShape;
};

const createStage = () =>
  Array.from(Array(STAGE_HEIGHT), () =>
    new Array(STAGE_WIDTH).fill([0, 'clear'])
  );

const checkCollision = (
  player: Player,
  stage: Stage,
  { x: moveX, y: moveY }: { x: number; y: number }
) => {
  for (let y = 0; y < player.tetromino.length; y += 1) {
    for (let x = 0; x < player.tetromino[y].length; x += 1) {
      // 1. Check that we're on an actual Tetromino cell
      if (player.tetromino[y][x] !== 0) {
        if (
          // 2. Check that our move is inside the game areas height (y)
          // We shouldn't go through the bottom of the play area
          !stage[y + player.pos.y + moveY] ||
          // 3. Check that our move is inside the game areas width (x)
          !stage[y + player.pos.y + moveY][x + player.pos.x + moveX] ||
          // 4. Check that the cell we're moving to isn't set to clear
          stage[y + player.pos.y + moveY][x + player.pos.x + moveX][1] !==
            'clear'
        ) {
          return true;
        }
      }
    }
  }
  return false;
};

export const useTetris = () => {
  const [mergedStage, setMergedStage] = useState<Stage>(createStage());
  const [dropTime, setDropTime] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [rows, setRows] = useState(0);
  const [level, setLevel] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const [player, setPlayer] = useState({
    pos: { x: 0, y: 0 },
    tetromino: TETROMINOES[0].shape as TetrominoShape,
  });
  
  const [nextPiece, setNextPiece] = useState(randomTetromino());

  const stage = useMemo(() => {
    const nextStage = mergedStage.map(row => row.map(cell => cell)) as Stage;
    player.tetromino.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          const stageY = y + player.pos.y;
          const stageX = x + player.pos.x;
          if (nextStage[stageY] && nextStage[stageY][stageX]) {
            nextStage[stageY][stageX] = [value, 'clear'];
          }
        }
      });
    });
    return nextStage;
  }, [mergedStage, player]);

  const movePlayer = (dir: number) => {
    if (!checkCollision(player, mergedStage, { x: dir, y: 0 })) {
      setPlayer(prev => ({
        ...prev,
        pos: { x: prev.pos.x + dir, y: prev.pos.y }
      }));
    }
  };

  const startGame = useCallback(() => {
    // Reset everything
    setMergedStage(createStage());
    setDropTime(1000);
    setGameOver(false);
    setScore(0);
    setRows(0);
    setLevel(0);
    setIsGameActive(true);
    setIsPaused(false);
    
    const newTetromino = randomTetromino();
    setPlayer({
      pos: { x: STAGE_WIDTH / 2 - 2, y: 0 },
      tetromino: newTetromino.shape,
    });
    setNextPiece(randomTetromino());
    
    tetrisAudio.init();
    tetrisAudio.startBGM();
  }, []);

  const sweepRows = (inputStage: Stage) => {
    let clearedRows = 0;
    const sweptStage = inputStage.reduce((ack, row) => {
      if (row.findIndex(cell => cell[0] === 0) === -1) {
        clearedRows += 1;
        ack.unshift(new Array(inputStage[0].length).fill([0, 'clear']));
        return ack;
      }
      ack.push(row);
      return ack;
    }, [] as Stage);
    return { sweptStage, clearedRows };
  };

  const mergePlayerIntoStage = (inputStage: Stage, currentPlayer: Player) => {
    const nextStage = inputStage.map(row => row.map(cell => cell)) as Stage;
    currentPlayer.tetromino.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          const stageY = y + currentPlayer.pos.y;
          const stageX = x + currentPlayer.pos.x;
          if (nextStage[stageY] && nextStage[stageY][stageX]) {
            nextStage[stageY][stageX] = [value, 'merged'];
          }
        }
      });
    });
    return nextStage;
  };

  const drop = () => {
    // Increase level when player has cleared 10 rows
    if (rows > (level + 1) * 10) {
      setLevel(prev => prev + 1);
      // Also increase speed
      setDropTime(1000 / (level + 1) + 200);
    }

    if (!checkCollision(player, mergedStage, { x: 0, y: 1 })) {
      setPlayer(prev => ({
        ...prev,
        pos: { x: prev.pos.x, y: prev.pos.y + 1 }
      }));
    } else {
      // Game Over
      if (player.pos.y < 1) {
        setGameOver(true);
        setDropTime(null);
        setIsGameActive(false);
        tetrisAudio.stopBGM();
        tetrisAudio.playGameOver();
        return;
      }

      const merged = mergePlayerIntoStage(mergedStage, player);
      const { sweptStage, clearedRows } = sweepRows(merged);
      setMergedStage(sweptStage);

      if (clearedRows > 0) {
        setRows(prev => prev + clearedRows);
        setScore(prev => prev + (clearedRows * 10 * (level + 1)));
        if (clearedRows >= 4) tetrisAudio.playTetris();
        else tetrisAudio.playLineClear();
      }

      setPlayer({
        pos: { x: STAGE_WIDTH / 2 - 2, y: 0 },
        tetromino: nextPiece.shape,
      });
      setNextPiece(randomTetromino());
      tetrisAudio.playDrop();
    }
  };

  const keyUp = ({ keyCode }: { keyCode: number }) => {
    if (!gameOver && !isPaused) {
      // Activate the interval again when user releases down arrow
      if (keyCode === 40) {
        setDropTime(1000 / (level + 1) + 200);
      }
    }
  };

  const dropPlayer = () => {
    setDropTime(null);
    drop();
  };

  const rotate = (matrix: TetrominoShape, dir: number) => {
    // Transpose
    const rotated = matrix.map((_, index) =>
      matrix.map(col => col[index])
    );
    // Reverse each row to get a rotated matrix
    if (dir > 0) return rotated.map(row => row.reverse());
    return rotated.reverse();
  };

  const playerRotate = (stage: Stage, dir: number) => {
    const clonedPlayer: Player = {
      pos: { x: player.pos.x, y: player.pos.y },
      tetromino: rotate(player.tetromino, dir),
    };

    const pos = clonedPlayer.pos.x;
    let offset = 1;
    while (checkCollision(clonedPlayer, stage, { x: 0, y: 0 })) {
      clonedPlayer.pos.x += offset;
      offset = -(offset + (offset > 0 ? 1 : -1));
      if (offset > clonedPlayer.tetromino[0].length) {
        rotate(clonedPlayer.tetromino, -dir);
        clonedPlayer.pos.x = pos;
        return;
      }
    }
    setPlayer(clonedPlayer);
    tetrisAudio.playRotate();
  };

  const move = (e: KeyboardEvent) => {
    const { keyCode, key } = e;
    if (!gameOver && !isPaused && isGameActive) {
      if (keyCode === 37) { // Left
        movePlayer(-1);
      } else if (keyCode === 39) { // Right
        movePlayer(1);
      } else if (keyCode === 40) { // Down
        dropPlayer();
      } else if (keyCode === 38) { // Up (Rotate)
        playerRotate(mergedStage, 1);
      } else if (key === 'p' || key === 'P') {
        setIsPaused(prev => !prev);
      }
    }
  };

  useInterval(() => {
    if (!isPaused) drop();
  }, dropTime);

  return {
    stage,
    player,
    nextPiece,
    score,
    rows,
    level,
    gameOver,
    isGameActive,
    isPaused,
    startGame,
    move,
    keyUp,
    setIsPaused
  };
};

// Helper hook for interval
function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<() => void>(null);
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  useEffect(() => {
    function tick() {
      if (savedCallback.current) savedCallback.current();
    }
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}
