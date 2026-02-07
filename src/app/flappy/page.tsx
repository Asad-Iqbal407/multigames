import FlappyBirdGame from "../../components/FlappyBirdGame";

export const metadata = {
  title: 'Neon Flappy | Neon Arcade',
  description: 'Classic Flappy Bird with a neon aesthetic',
};

export default function FlappyBirdPage() {
  return (
    <main className="min-h-screen bg-black">
      <FlappyBirdGame />
    </main>
  );
}
