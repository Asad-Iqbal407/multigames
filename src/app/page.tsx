"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#030303] flex flex-col items-center font-sans text-white relative selection:bg-indigo-500/30 overflow-hidden">
      
      {/* Modern Background - Gradient Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-900/20 rounded-full blur-[120px] opacity-50 animate-pulse-slow" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-fuchsia-900/20 rounded-full blur-[120px] opacity-50 animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[40%] h-[40%] bg-cyan-900/10 rounded-full blur-[100px] opacity-30" />
      </div>
      
      {/* Subtle Grid - Very light and modern */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]" 
           style={{ 
             backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', 
             backgroundSize: '40px 40px',
             maskImage: 'radial-gradient(circle at center, black, transparent 80%)'
           }} 
      />

      <div className="z-10 flex flex-col items-center gap-32 max-w-7xl w-full py-32 px-6">
        
        {/* Modern Hero Section */}
        <div className="text-center space-y-8 relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-4 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono text-zinc-300 tracking-wider">SYSTEM ONLINE v2.0</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-500 pb-2">
            NEXT GEN <br/> ARCADE
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed font-light">
            Experience a curated collection of timeless games, reimagined with modern performance and stunning aesthetics.
          </p>
          
          <div className="flex items-center justify-center gap-6 pt-4">
             <button className="px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
               Play Now
             </button>
             <button className="px-8 py-4 bg-white/5 text-white font-medium border border-white/10 rounded-full hover:bg-white/10 transition-all backdrop-blur-md">
               Explore Collection
             </button>
          </div>
        </div>

        {/* Modern Game Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          
          {/* Snake Card */}
          <GameCard 
            href="/snake"
            title="Snake"
            category="Classic"
            description="Navigate the grid, consume energy, and grow without limits."
            icon="🐍"
            accent="emerald"
          />

          {/* Tetris Card */}
          <GameCard 
            href="/tetris"
            title="Tetris"
            category="Puzzle"
            description="Master the art of geometry and clear lines under pressure."
            icon="🧱"
            accent="violet"
          />

          {/* Flappy Bird Card */}
          <GameCard 
            href="/flappy"
            title="Flappy"
            category="Endless"
            description="Test your precision and timing in this endless aerial challenge."
            icon="🐦"
            accent="amber"
          />

          {/* Ping Pong Card */}
          <GameCard 
            href="/pong"
            title="Pong"
            category="Sports"
            description="The original digital sport. Fast-paced competitive reflexes."
            icon="🏓"
            accent="cyan"
          />

          {/* Car Racing Card */}
          <GameCard 
            href="/car-racing"
            title="Racing"
            category="Action"
            description="High-velocity track racing. Dodge traffic and set records."
            icon="🏎️"
            accent="blue"
          />

          {/* Star War Card */}
          <GameCard 
            href="/star-war"
            title="Star War"
            category="Shooter"
            description="Defend the galaxy against endless waves of cosmic threats."
            icon="🚀"
            accent="rose"
            isNew={true}
          />

          {/* Bubble Shooter Card */}
          <GameCard 
            href="/bubble-shooter"
            title="Bubbles"
            category="Puzzle"
            description="Match colors and clear the board in this addictive puzzler."
            icon="🫧"
            accent="sky"
            isNew={true}
          />

          {/* Super Bino Go Card */}
          <GameCard 
            href="/super-bino"
            title="Super Bino"
            category="Platformer"
            description="Run, jump, and explore vibrant worlds in this platforming adventure."
            icon="🍄"
            accent="indigo"
            isNew={true}
          />

          <GameCard 
            href="/archer"
            title="Duck Hunt"
            category="Action"
            description="Track fast flying ducks and advance stages with perfect shots."
            icon="🏹"
            accent="amber"
            isNew={true}
          />

        </div>

        {/* Features Section - Modern Minimalist */}
        <div className="w-full py-24 border-y border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-zinc-900 rounded-2xl border border-white/10 flex items-center justify-center text-3xl mx-auto">
                ⚡
              </div>
              <h3 className="text-xl font-bold">Instant Play</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                No downloads, no installations. Powered by Next.js for zero-latency gaming.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 bg-zinc-900 rounded-2xl border border-white/10 flex items-center justify-center text-3xl mx-auto">
                🎨
              </div>
              <h3 className="text-xl font-bold">Immersive Design</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Crafted with Tailwind CSS and Framer Motion for a premium visual experience.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 bg-zinc-900 rounded-2xl border border-white/10 flex items-center justify-center text-3xl mx-auto">
                📱
              </div>
              <h3 className="text-xl font-bold">Fully Responsive</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Optimized for all devices. Play on desktop, tablet, or mobile seamlessly.
              </p>
            </div>
          </div>
        </div>

        {/* Modern Footer */}
        <footer className="w-full text-center space-y-8">
          <div className="flex items-center justify-center gap-8 text-zinc-500">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="hover:text-white transition-colors">Contact</Link>
            <Link href="#" className="hover:text-white transition-colors">GitHub</Link>
          </div>
          <p className="text-zinc-600 text-sm">
            © 2026 Arcade Pro. All rights reserved. Designed for the future.
          </p>
        </footer>

      </div>
    </main>
  );
}

interface GameCardProps {
  href: string;
  title: string;
  category: string;
  description: string;
  icon: string;
  accent: "emerald" | "violet" | "amber" | "cyan" | "blue" | "rose" | "sky" | "indigo";
  isNew?: boolean;
}

function GameCard({ href, title, category, description, icon, accent, isNew = false }: GameCardProps) {
  const accentColorMap: Record<string, string> = {
    emerald: "group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20",
    violet: "group-hover:bg-violet-500/10 group-hover:border-violet-500/20",
    amber: "group-hover:bg-amber-500/10 group-hover:border-amber-500/20",
    cyan: "group-hover:bg-cyan-500/10 group-hover:border-cyan-500/20",
    blue: "group-hover:bg-blue-500/10 group-hover:border-blue-500/20",
    rose: "group-hover:bg-rose-500/10 group-hover:border-rose-500/20",
    sky: "group-hover:bg-sky-500/10 group-hover:border-sky-500/20",
    indigo: "group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20",
  };

  const textColorMap: Record<string, string> = {
    emerald: "text-emerald-400",
    violet: "text-violet-400",
    amber: "text-amber-400",
    cyan: "text-cyan-400",
    blue: "text-blue-400",
    rose: "text-rose-400",
    sky: "text-sky-400",
    indigo: "text-indigo-400",
  };

  return (
    <Link href={href} className="group relative block h-full">
      <div className={`relative h-full flex flex-col bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${accentColorMap[accent]}`}>
        
        {isNew && (
          <div className="absolute top-6 right-6 px-3 py-1 bg-white/10 text-white text-[10px] font-bold rounded-full border border-white/10 backdrop-blur-md">
            NEW
          </div>
        )}

        <div className="mb-6">
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
        </div>

        <div className="space-y-2 mb-8">
          <div className={`text-xs font-bold uppercase tracking-wider ${textColorMap[accent]}`}>
            {category}
          </div>
          <h2 className="text-2xl font-bold text-white group-hover:text-white/90 transition-colors">
            {title}
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            {description}
          </p>
        </div>

        <div className="mt-auto flex items-center gap-2 text-sm font-medium text-white/40 group-hover:text-white transition-colors">
          <span>Play Now</span>
          <span className="transform group-hover:translate-x-1 transition-transform">→</span>
        </div>

      </div>
    </Link>
  );
}
