export type TetrominoShape = (string | number)[][];

export const TETROMINOES = {
  0: { shape: [[0]], color: '0, 0, 0' },
  I: {
    shape: [
      [0, 'I', 0, 0],
      [0, 'I', 0, 0],
      [0, 'I', 0, 0],
      [0, 'I', 0, 0],
    ],
    color: '0, 240, 240', // Cyan
  },
  J: {
    shape: [
      [0, 'J', 0],
      [0, 'J', 0],
      ['J', 'J', 0],
    ],
    color: '0, 0, 240', // Blue
  },
  L: {
    shape: [
      [0, 'L', 0],
      [0, 'L', 0],
      [0, 'L', 'L'],
    ],
    color: '240, 160, 0', // Orange
  },
  O: {
    shape: [
      ['O', 'O'],
      ['O', 'O'],
    ],
    color: '240, 240, 0', // Yellow
  },
  S: {
    shape: [
      [0, 'S', 'S'],
      ['S', 'S', 0],
      [0, 0, 0],
    ],
    color: '0, 240, 0', // Green
  },
  T: {
    shape: [
      [0, 0, 0],
      ['T', 'T', 'T'],
      [0, 'T', 0],
    ],
    color: '160, 0, 240', // Purple
  },
  Z: {
    shape: [
      ['Z', 'Z', 0],
      [0, 'Z', 'Z'],
      [0, 0, 0],
    ],
    color: '240, 0, 0', // Red
  },
};

// 7-Bag Randomizer Logic
let bag: string[] = [];

const shuffle = (array: string[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export const randomTetromino = () => {
  if (bag.length === 0) {
    bag = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    shuffle(bag);
  }
  
  const randTetromino = bag.pop() as keyof typeof TETROMINOES;
  return TETROMINOES[randTetromino];
};
