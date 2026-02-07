import TetrisGame from "../../components/TetrisGame";

export const metadata = {
  title: 'Neon Tetris | Neon Arcade',
  description: 'Classic Tetris with a neon aesthetic',
};

export default function TetrisPage() {
  return (
    <main className="min-h-screen bg-black">
      <TetrisGame />
    </main>
  );
}
