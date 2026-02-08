import SupermanDinoGame from "../../components/SupermanDinoGame";

export const metadata = {
  title: "Superman vs Dino | Neon Arcade",
  description: "Modern action duel with flight, weapons, and fire-breath attacks"
};

export default function SupermanDinoPage() {
  return (
    <main className="min-h-screen bg-black">
      <SupermanDinoGame />
    </main>
  );
}
