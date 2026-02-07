import StarWarGame from "../../components/StarWarGame";

export const metadata = {
  title: "Star War | Neon Arcade",
  description: "Neon space shooter with keyboard and touch controls"
};

export default function StarWarPage() {
  return (
    <main className="min-h-screen bg-black">
      <StarWarGame />
    </main>
  );
}

