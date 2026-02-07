import SnakeGame from "../../components/SnakeGame";

export const metadata = {
  title: 'Neon Snake | Neon Arcade',
  description: 'Classic Snake with a neon aesthetic',
};

export default function SnakePage() {
  return (
    <main className="min-h-screen bg-black">
      <SnakeGame />
    </main>
  );
}
