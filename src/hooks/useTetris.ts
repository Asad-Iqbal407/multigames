import { useState, useEffect, useCallback, useRef } from 'react';
import { TETROMINOES, randomTetromino, TetrominoShape } from '../utils/tetrominoes';
import { tetrisAudio } from '../utils/tetrisAudio';

export const STAGE_WIDTH = 10;
export const STAGE_HEIGHT = 20;

type Cell = [string | number, string]; // [type, state] e.g. [0, 'clear'] or ['J', 'merged']
export type Stage = Cell[][];

const createStage = () =>
  Array.from(Array(STAGE_HEIGHT), () =>
    new Array(STAGE_WIDTH).fill([0, 'clear'])
  );

const checkCollision = (
  player: any,
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
  const [stage, setStage] = useState<Stage>(createStage());
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
    collided: false,
  });
  
  const [nextPiece, setNextPiece] = useState(randomTetromino());

  const movePlayer = (dir: number) => {
    if (!checkCollision(player, stage, { x: dir, y: 0 })) {
      setPlayer(prev => ({
        ...prev,
        pos: { x: prev.pos.x + dir, y: prev.pos.y }
      }));
    }
  };

  const startGame = useCallback(() => {
    // Reset everything
    setStage(createStage());
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
      collided: false,
    });
    setNextPiece(randomTetromino());
    
    tetrisAudio.init();
    tetrisAudio.startBGM();
  }, []);

  const resetGame = () => {
    setGameOver(true);
    setDropTime(null);
    setIsGameActive(false);
    tetrisAudio.stopBGM();
    tetrisAudio.playGameOver();
  };

  const drop = () => {
    // Increase level when player has cleared 10 rows
    if (rows > (level + 1) * 10) {
      setLevel(prev => prev + 1);
      // Also increase speed
      setDropTime(1000 / (level + 1) + 200);
    }

    if (!checkCollision(player, stage, { x: 0, y: 1 })) {
      setPlayer(prev => ({
        ...prev,
        pos: { x: prev.pos.x, y: prev.pos.y + 1 },
        collided: false,
      }));
    } else {
      // Game Over
      if (player.pos.y < 1) {
        setGameOver(true);
        setDropTime(null);
        setIsGameActive(false);
        tetrisAudio.stopBGM();
        tetrisAudio.playGameOver();
      }
      setPlayer(prev => ({ ...prev, collided: true }));
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
    const clonedPlayer = JSON.parse(JSON.stringify(player));
    clonedPlayer.tetromino = rotate(clonedPlayer.tetromino, dir);

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

  const move = ({ keyCode, preventDefault, key }: KeyboardEvent) => {
    if (!gameOver && !isPaused && isGameActive) {
      if (keyCode === 37) { // Left
        movePlayer(-1);
      } else if (keyCode === 39) { // Right
        movePlayer(1);
      } else if (keyCode === 40) { // Down
        dropPlayer();
      } else if (keyCode === 38) { // Up (Rotate)
        playerRotate(stage, 1);
      } else if (key === 'p' || key === 'P') {
        setIsPaused(prev => !prev);
      }
    }
  };

  useInterval(() => {
    if (!isPaused) drop();
  }, dropTime);

  // Update Stage
  useEffect(() => {
    const sweepRows = (newStage: Stage) => {
      let clearedRows = 0;
      const sweptStage = newStage.reduce((ack, row) => {
        if (row.findIndex(cell => cell[0] === 0) === -1) {
          clearedRows += 1;
          ack.unshift(new Array(newStage[0].length).fill([0, 'clear']));
          return ack;
        }
        ack.push(row);
        return ack;
      }, [] as Stage);
      
      if (clearedRows > 0) {
        setRows(prev => prev + clearedRows);
        setScore(prev => prev + (clearedRows * 10 * (level + 1))); // Score logic
        if (clearedRows >= 4) tetrisAudio.playTetris();
        else tetrisAudio.playLineClear();
      }
      return sweptStage;
    };

    const updateStage = (prevStage: Stage) => {
      // First flush the stage from the previous render
      const newStage = prevStage.map(row =>
        row.map(cell => (cell[1] === 'clear' ? [0, 'clear'] : cell))
      ) as Stage;

      // Draw tetromino
      player.tetromino.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            if (
              newStage[y + player.pos.y] &&
              newStage[y + player.pos.y][x + player.pos.x]
            ) {
              newStage[y + player.pos.y][x + player.pos.x] = [
                value,
                `${player.collided ? 'merged' : 'clear'}`,
              ];
            }
          }
        });
      });

      // Collision handled
      if (player.collided) {
        // Reset player
        setPlayer({
          pos: { x: STAGE_WIDTH / 2 - 2, y: 0 },
          tetromino: nextPiece.shape,
          collided: false,
        });
        setNextPiece(randomTetromino());
        return sweepRows(newStage);
      }

      return newStage;
    };

    setStage(prev => updateStage(prev));
  }, [player, nextPiece, level]); // Depend on player state

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
