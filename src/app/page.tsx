import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center font-orbitron text-white p-4 overflow-hidden relative">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black z-0 pointer-events-none" />
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
      />

      <div className="z-10 flex flex-col items-center gap-12 max-w-6xl w-full">
        
        {/* Title Section */}
        <div className="text-center space-y-4 animate-pulse">
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 drop-shadow-[0_0_20px_rgba(200,0,255,0.5)]">
            NEON ARCADE
          </h1>
          <p className="text-xl md:text-2xl text-zinc-400 font-press-start mt-4 tracking-widest">
            SELECT YOUR GAME
          </p>
        </div>

        {/* Game Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full mt-8 px-4">
          
          {/* Snake Card */}
          <Link href="/snake" className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-700 rounded-2xl blur opacity-20 group-hover:opacity-60 transition-opacity duration-500" />
            <div className="relative bg-zinc-900/90 border-2 border-green-500/30 group-hover:border-green-400 rounded-2xl p-6 flex flex-col items-center gap-6 transition-all duration-300 transform group-hover:-translate-y-2 group-hover:scale-105 overflow-hidden h-full">
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
              
              <div className="w-20 h-20 rounded-full bg-green-900/50 flex items-center justify-center border-4 border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.4)] group-hover:shadow-[0_0_50px_rgba(34,197,94,0.6)] transition-all">
                <span className="text-4xl">🐍</span>
              </div>
              
              <div className="text-center z-10 flex-grow">
                <h2 className="text-xl font-bold text-green-400 mb-2 font-press-start">SNAKE</h2>
                <p className="text-zinc-400 text-[10px] leading-relaxed">Classic gameplay with modern neon aesthetics.</p>
              </div>
              
              <div className="mt-auto w-full text-center py-2 bg-green-600/20 text-green-300 rounded border border-green-500/50 text-[10px] font-press-start group-hover:bg-green-500 group-hover:text-black transition-colors">
                PLAY
              </div>
            </div>
          </Link>

          {/* Tetris Card */}
          <Link href="/tetris" className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-700 rounded-2xl blur opacity-20 group-hover:opacity-60 transition-opacity duration-500" />
            <div className="relative bg-zinc-900/90 border-2 border-purple-500/30 group-hover:border-purple-400 rounded-2xl p-6 flex flex-col items-center gap-6 transition-all duration-300 transform group-hover:-translate-y-2 group-hover:scale-105 overflow-hidden h-full">
               <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

              <div className="w-20 h-20 rounded-full bg-purple-900/50 flex items-center justify-center border-4 border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.4)] group-hover:shadow-[0_0_50px_rgba(168,85,247,0.6)] transition-all">
                <div className="grid grid-cols-2 gap-1 rotate-12 scale-50">
                   <div className="w-6 h-6 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                   <div className="w-6 h-6 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
                   <div className="w-6 h-6 bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
                   <div className="w-6 h-6 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                </div>
              </div>
              
              <div className="text-center z-10 flex-grow">
                <h2 className="text-xl font-bold text-purple-400 mb-2 font-press-start">TETRIS</h2>
                <p className="text-zinc-400 text-[10px] leading-relaxed">Stack blocks with balanced 7-bag RNG!</p>
              </div>
              
              <div className="mt-auto w-full text-center py-2 bg-purple-600/20 text-purple-300 rounded border border-purple-500/50 text-[10px] font-press-start group-hover:bg-purple-500 group-hover:text-black transition-colors">
                PLAY
              </div>
            </div>
          </Link>

          {/* Flappy Bird Card */}
          <Link href="/flappy" className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-600 rounded-2xl blur opacity-20 group-hover:opacity-60 transition-opacity duration-500" />
            <div className="relative bg-zinc-900/90 border-2 border-yellow-500/30 group-hover:border-yellow-400 rounded-2xl p-6 flex flex-col items-center gap-6 transition-all duration-300 transform group-hover:-translate-y-2 group-hover:scale-105 overflow-hidden h-full">
               <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

              <div className="w-20 h-20 rounded-full bg-yellow-900/50 flex items-center justify-center border-4 border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.4)] group-hover:shadow-[0_0_50px_rgba(234,179,8,0.6)] transition-all">
                <span className="text-4xl">🐦</span>
              </div>
              
              <div className="text-center z-10 flex-grow">
                <h2 className="text-xl font-bold text-yellow-400 mb-2 font-press-start">FLAPPY</h2>
                <p className="text-zinc-400 text-[10px] leading-relaxed">Navigate the pipes in this neon endless runner.</p>
              </div>
              
              <div className="mt-auto w-full text-center py-2 bg-yellow-600/20 text-yellow-300 rounded border border-yellow-500/50 text-[10px] font-press-start group-hover:bg-yellow-500 group-hover:text-black transition-colors">
                PLAY
              </div>
            </div>
          </Link>

          {/* Ping Pong Card */}
          <Link href="/pong" className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-60 transition-opacity duration-500" />
            <div className="relative bg-zinc-900/90 border-2 border-cyan-500/30 group-hover:border-cyan-400 rounded-2xl p-6 flex flex-col items-center gap-6 transition-all duration-300 transform group-hover:-translate-y-2 group-hover:scale-105 overflow-hidden h-full">
               <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

              <div className="w-20 h-20 rounded-full bg-cyan-900/50 flex items-center justify-center border-4 border-cyan-500/50 shadow-[0_0_30px_rgba(34,211,238,0.4)] group-hover:shadow-[0_0_50px_rgba(34,211,238,0.6)] transition-all">
                <div className="flex gap-2">
                   <div className="w-2 h-10 bg-cyan-400" />
                   <div className="w-2 h-2 bg-white self-center shadow-[0_0_10px_white]" />
                   <div className="w-2 h-10 bg-pink-500" />
                </div>
              </div>
              
              <div className="text-center z-10 flex-grow">
                <h2 className="text-xl font-bold text-cyan-400 mb-2 font-press-start">PONG</h2>
                <p className="text-zinc-400 text-[10px] leading-relaxed">Classic paddle action against a clever AI opponent.</p>
              </div>
              
              <div className="mt-auto w-full text-center py-2 bg-cyan-600/20 text-cyan-300 rounded border border-cyan-500/50 text-[10px] font-press-start group-hover:bg-cyan-500 group-hover:text-black transition-colors">
                PLAY
              </div>
            </div>
          </Link>

        </div>

        <div className="text-zinc-600 text-xs font-mono mt-12 text-center">
          Play with Keyboard or Touch • Press P to Pause (Tetris)
        </div>
      </div>
    </main>
  );
}
