import PongGame from '@/components/PongGame';

export const metadata = {
  title: 'Neon Pong | Neon Arcade',
  description: 'Classic Pong with a neon aesthetic',
};

export default function PongPage() {
  return (
    <main>
      <PongGame />
    </main>
  );
}
