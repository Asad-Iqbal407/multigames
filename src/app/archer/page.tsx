import ArcherGame from "../../components/ArcherGame";

export const metadata = {
  title: "Duck Hunt | Neon Arcade",
  description: "Hunt flying ducks with precision archery and fast stages"
};

export default function ArcherPage() {
  return (
    <main className="min-h-screen bg-black">
      <ArcherGame />
    </main>
  );
}
