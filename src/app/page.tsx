"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [stars, setStars] = useState<{ top: string; left: string; width: string; height: string; delay: string; opacity: number }[]>([]);

  useEffect(() => {
    const newStars = [...Array(50)].map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      width: `${Math.random() * 2 + 1}px`,
      height: `${Math.random() * 2 + 1}px`,
      delay: `${Math.random() * 5}s`,
      opacity: Math.random(),
    }));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStars(newStars);
  }, []);

  return (
    <main className="min-h-screen bg-[#020202] flex flex-col items-center font-orbitron text-white relative selection:bg-cyan-500/30">
      
      {/* Background Ambience - Fixed for consistency */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(88,28,135,0.15),transparent_70%)] z-0 pointer-events-none" />
      
      {/* Animated Starfield - Fixed */}
      <div className="fixed inset-0 z-0 opacity-30 pointer-events-none overflow-hidden">
        <div className="stars-container absolute inset-0">
          {stars.map((star, i) => (
            <div 
              key={i}
              className="absolute bg-white rounded-full animate-twinkle"
              style={{
                top: star.top,
                left: star.left,
                width: star.width,
                height: star.height,
                animationDelay: star.delay,
                opacity: star.opacity
              }}
            />
          ))}
        </div>
      </div>

      {/* Retro Grid - Fixed and adjusted */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.15]" 
           style={{ 
             backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)', 
             backgroundSize: '60px 60px',
             transform: 'perspective(500px) rotateX(60deg) translateY(-100px) scale(2)',
             transformOrigin: 'top'
           }} 
      />

      {/* CRT Scanline Effect - Fixed */}
      <div className="fixed inset-0 z-50 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />

      <div className="z-10 flex flex-col items-center gap-24 max-w-7xl w-full py-24">
        
        {/* Title Section */}
        <div className="text-center space-y-6 relative">
          <div className="absolute -inset-x-20 -top-20 -bottom-10 bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />
          
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter relative">
            <span className="absolute inset-0 text-cyan-500/20 blur-xl select-none">NEON ARCADE</span>
            <span className="relative bg-clip-text text-transparent bg-gradient-to-b from-white via-cyan-100 to-cyan-500 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-neon-flicker">
              NEON ARCADE
            </span>
          </h1>
          
          <div className="flex items-center justify-center gap-4">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-zinc-500" />
            <p className="text-sm md:text-lg text-zinc-400 font-press-start tracking-[0.3em] uppercase">
              Select Start
            </p>
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-zinc-500" />
          </div>
        </div>

        {/* Game Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-5xl px-6">
          
          {/* Snake Card */}
          <GameCard 
            href="/snake"
            title="SNAKE"
            description="Classic neon gluttony."
            icon="🐍"
            color="green"
            gradient="from-green-500 to-emerald-700"
          />

          {/* Tetris Card */}
          <GameCard 
            href="/tetris"
            title="TETRIS"
            description="Perfect the stack."
            icon={
              <div className="grid grid-cols-2 gap-1 rotate-12 scale-75">
                <div className="w-4 h-4 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                <div className="w-4 h-4 bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                <div className="w-4 h-4 bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
                <div className="w-4 h-4 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              </div>
            }
            color="purple"
            gradient="from-purple-500 to-pink-700"
          />

          {/* Flappy Bird Card */}
          <GameCard 
            href="/flappy"
            title="FLAPPY"
            description="Endless neon flight."
            icon="🐦"
            color="yellow"
            gradient="from-yellow-400 to-orange-600"
          />

          {/* Ping Pong Card */}
          <GameCard 
            href="/pong"
            title="PONG"
            description="Retro paddle battle."
            icon={
              <div className="flex gap-1.5">
                <div className="w-1.5 h-8 bg-cyan-400 shadow-[0_0_8px_cyan]" />
                <div className="w-1.5 h-1.5 bg-white self-center shadow-[0_0_8px_white]" />
                <div className="w-1.5 h-8 bg-pink-500 shadow-[0_0_8px_pink]" />
              </div>
            }
            color="cyan"
            gradient="from-cyan-400 to-blue-600"
          />

          {/* Car Racing Card */}
          <GameCard 
            href="/car-racing"
            title="RACING"
            description="High-speed neon drift."
            icon="🏎️"
            color="blue"
            gradient="from-blue-500 to-indigo-700"
          />

          {/* Star War Card */}
          <GameCard 
            href="/star-war"
            title="STAR WAR"
            description="Deep space survival."
            icon="🚀"
            color="fuchsia"
            gradient="from-fuchsia-500 to-cyan-500"
            isNew={true}
          />

          {/* Bubble Shooter Card */}
          <GameCard 
            href="/bubble-shooter"
            title="BUBBLES"
            description="Neon chain reactions."
            icon={
              <div className="relative w-10 h-10">
                <div className="absolute top-0 left-0 w-6 h-6 rounded-full bg-cyan-400 shadow-[0_0_10px_cyan] opacity-80" />
                <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-fuchsia-500 shadow-[0_0_10px_fuchsia] opacity-80" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-yellow-400 shadow-[0_0_10px_yellow]" />
              </div>
            }
            color="cyan"
            gradient="from-cyan-400 to-purple-600"
            isNew={true}
          />

        </div>

        {/* Motivation Section */}
        <div className="w-full max-w-6xl px-6 space-y-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                REKINDLE THE <br/>
                <span className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">DIGITAL FLAME</span>
              </h2>
              <p className="text-zinc-400 leading-relaxed font-mono text-sm md:text-base">
                Step into a world where pixels tell stories and every high score is a legacy. 
                Our arcade is more than just games&mdash;it&apos;s a journey back to the golden age of 
                interactive entertainment, reimagined for the modern web.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { title: "NOSTALGIA", desc: "Classic mechanics, modern polish." },
                  { title: "CHALLENGE", desc: "Test your reflexes to the limit." },
                  { title: "INSTANT", desc: "No downloads. Just click and play." },
                  { title: "NEON", desc: "Immersive synthwave aesthetics." }
                ].map((item, i) => (
                  <div key={i} className="border-l-2 border-cyan-500/30 pl-4 space-y-1">
                    <h3 className="text-xs font-bold text-white font-press-start tracking-tighter">{item.title}</h3>
                    <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full" />
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center text-2xl">🏆</div>
                    <div>
                      <h4 className="text-sm font-bold font-press-start">MISSION STATEMENT</h4>
                      <p className="text-[10px] text-zinc-500 font-mono">EST. 2026</p>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-300 italic font-serif">
                    &quot;To provide a seamless, high-performance gaming environment where everyone can rediscover the joy of arcade classics.&quot;
                  </p>
                  <div className="pt-4 flex justify-between items-end">
                    <div className="space-y-1">
                      <div className="h-1 w-24 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full w-3/4 bg-cyan-500 shadow-[0_0_10px_cyan]" />
                      </div>
                      <p className="text-[8px] text-zinc-500 font-mono">SYSTEM INTEGRITY: 98%</p>
                    </div>
                    <button className="text-[10px] font-press-start text-cyan-400 hover:text-white transition-colors">
                      LEARN MORE _
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center space-y-8 py-12">
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter">
              READY TO <span className="bg-white text-black px-4 py-1 rotate-2 inline-block">ASCEND?</span>
            </h2>
            <p className="text-zinc-500 font-mono text-xs md:text-sm max-w-2xl mx-auto uppercase tracking-[0.2em]">
              Join thousands of players in the ultimate neon playground. 
              Your next high score is just a click away.
            </p>
          </div>
        </div>

        {/* Enhanced Footer */}
        <footer className="w-full border-t border-white/5 bg-zinc-900/20 backdrop-blur-xl py-16 px-6 mt-12">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="space-y-6">
              <div className="text-2xl font-black tracking-tighter text-white">
                NEON<span className="text-cyan-400">ARCADE</span>
              </div>
              <p className="text-zinc-500 text-xs font-mono leading-relaxed uppercase tracking-wider">
                The ultimate collection of retro-modern arcade games built for the next generation of players.
              </p>
              <div className="flex gap-4">
                {['TW', 'GH', 'DC', 'IG'].map(s => (
                  <div key={s} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-zinc-400 hover:bg-cyan-500 hover:text-black transition-all cursor-pointer">
                    {s}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-press-start text-white tracking-widest">GAMES</h4>
              <ul className="space-y-3">
                {['Snake', 'Tetris', 'Flappy', 'Pong', 'Racing', 'Star War', 'Bubble Shooter'].map(g => (
                  <li key={g}>
                    <Link href={`/${g.toLowerCase().replace(' ', '-')}`} className="text-zinc-500 hover:text-cyan-400 text-xs font-mono uppercase tracking-widest transition-colors">
                      {g}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-press-start text-white tracking-widest">SYSTEM</h4>
              <ul className="space-y-3 text-zinc-500 text-xs font-mono uppercase tracking-widest">
                <li><span className="text-cyan-500">_</span> Status: Online</li>
                <li><span className="text-cyan-500">_</span> Latency: 14ms</li>
                <li><span className="text-cyan-500">_</span> Version: 1.0.4</li>
                <li><span className="text-cyan-500">_</span> Region: Global</li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-press-start text-white tracking-widest">NEWSLETTER</h4>
              <div className="relative group">
                <input 
                  type="email" 
                  placeholder="USER@NET.SYS"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-cyan-500 transition-colors"
                />
                <button className="absolute right-2 top-2 bottom-2 px-4 bg-cyan-500 text-black text-[10px] font-bold rounded hover:bg-white transition-colors">
                  JOIN
                </button>
              </div>
              <p className="text-[8px] text-zinc-600 font-mono uppercase tracking-tighter">
                * By joining you agree to receive system updates and promotional data.
              </p>
            </div>
          </div>

          <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex gap-8 text-[10px] text-zinc-600 font-mono tracking-widest uppercase">
              <span>[ WASD ] MOVE</span>
              <span>[ SPACE ] ACTION</span>
              <span>[ P ] PAUSE</span>
            </div>
            <div className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">
              © 2026 NEON ARCADE CO. <span className="mx-2 text-zinc-800">|</span> ALL RIGHTS RESERVED
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

interface GameCardProps {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: "green" | "purple" | "yellow" | "cyan" | "blue" | "fuchsia";
  gradient: string;
  isNew?: boolean;
}

function GameCard({ href, title, description, icon, color, gradient, isNew = false }: GameCardProps) {
  const colorMap: Record<string, string> = {
    green: "border-green-500/30 group-hover:border-green-400 group-hover:shadow-[0_0_30px_rgba(34,197,94,0.3)]",
    purple: "border-purple-500/30 group-hover:border-purple-400 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]",
    yellow: "border-yellow-500/30 group-hover:border-yellow-400 group-hover:shadow-[0_0_30px_rgba(234,179,8,0.3)]",
    cyan: "border-cyan-500/30 group-hover:border-cyan-400 group-hover:shadow-[0_0_30px_rgba(34,211,238,0.3)]",
    blue: "border-blue-500/30 group-hover:border-blue-400 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]",
    fuchsia: "border-fuchsia-500/30 group-hover:border-fuchsia-400 group-hover:shadow-[0_0_30px_rgba(217,70,239,0.3)]",
  };

  const textColorMap: Record<string, string> = {
    green: "text-green-400",
    purple: "text-purple-400",
    yellow: "text-yellow-400",
    cyan: "text-cyan-400",
    blue: "text-blue-400",
    fuchsia: "text-fuchsia-400",
  };

  const iconBgMap: Record<string, string> = {
    green: "bg-green-900/20 border-green-500/40 shadow-[0_0_20px_rgba(34,197,94,0.2)]",
    purple: "bg-purple-900/20 border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.2)]",
    yellow: "bg-yellow-900/20 border-yellow-500/40 shadow-[0_0_20px_rgba(234,179,8,0.2)]",
    cyan: "bg-cyan-900/20 border-cyan-500/40 shadow-[0_0_20px_rgba(34,211,238,0.2)]",
    blue: "bg-blue-900/20 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.2)]",
    fuchsia: "bg-fuchsia-900/20 border-fuchsia-500/40 shadow-[0_0_20px_rgba(217,70,239,0.2)]",
  };

  return (
    <Link href={href} className="group relative block h-full">
      {/* Glow Backdrop */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
      
      {/* Card Content */}
      <div className={`relative h-full flex flex-col items-center bg-zinc-900/40 backdrop-blur-md border-2 ${colorMap[color]} rounded-2xl p-6 transition-all duration-500 transform group-hover:-translate-y-3 overflow-hidden`}>
        
        {/* Is New Badge */}
        {isNew && (
          <div className="absolute -right-12 top-4 rotate-45 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-[8px] font-black px-12 py-1 shadow-[0_0_15px_rgba(234,179,8,0.5)] z-20 font-press-start">
            NEW
          </div>
        )}

        {/* Scanline Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20" />
        
        {/* Icon Circle */}
        <div className={`w-20 h-20 rounded-2xl ${iconBgMap[color]} flex items-center justify-center border-2 mb-6 group-hover:scale-110 transition-transform duration-500 relative z-10`}>
          <div className="absolute inset-0 bg-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="text-4xl group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all">
            {icon}
          </span>
        </div>
        
        <div className="text-center z-10 flex flex-col flex-grow w-full">
          <h2 className={`text-lg font-bold ${textColorMap[color]} mb-2 font-press-start tracking-tighter group-hover:scale-105 transition-transform`}>
            {title}
          </h2>
          <p className="text-zinc-500 text-[9px] font-mono leading-relaxed mb-6 h-8 flex items-center justify-center uppercase tracking-wider">
            {description}
          </p>
        </div>
        
        <div className="mt-auto w-full relative group/btn overflow-hidden rounded-lg">
           <div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-20 group-hover/btn:opacity-100 transition-opacity duration-300`} />
           <div className="relative py-2.5 text-center text-white text-[10px] font-press-start border border-white/10 group-hover/btn:text-black group-hover/btn:border-transparent transition-colors">
             Initialize
           </div>
        </div>
      </div>
    </Link>
  );
}
