"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const games = [
  { name: 'SNAKE', href: '/snake', icon: '🐍', color: 'text-emerald-400' },
  { name: 'TETRIS', href: '/tetris', icon: '🧱', color: 'text-violet-400' },
  { name: 'FLAPPY', href: '/flappy', icon: '🐦', color: 'text-amber-400' },
  { name: 'PONG', href: '/pong', icon: '🏓', color: 'text-cyan-400' },
  { name: 'RACING', href: '/car-racing', icon: '🏎️', color: 'text-blue-400' },
  { name: 'STAR WAR', href: '/star-war', icon: '🚀', color: 'text-rose-400' },
  { name: 'BUBBLES', href: '/bubble-shooter', icon: '🫧', color: 'text-sky-400' },
  { name: 'SUPER BINO', href: '/super-bino', icon: '🍄', color: 'text-indigo-400' },
];

const ArcadeNav: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === '/';

  // Close nav when clicking outside or on a link
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  if (isHome) return null; // Don't show nav on home page (it already has the grid)

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-[100] group font-sans">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 rounded-full bg-zinc-900/80 backdrop-blur-xl border transition-all duration-300 flex items-center justify-center text-xl shadow-2xl ${
          isOpen 
            ? 'border-white/40 text-white rotate-90' 
            : 'border-white/10 text-white/50 hover:border-white/30 hover:text-white'
        }`}
      >
        {isOpen ? '✕' : '🎮'}
      </button>

      {/* Nav Menu */}
      <div className={`absolute left-16 top-1/2 -translate-y-1/2 transition-all duration-500 ${
        isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10 pointer-events-none'
      }`}>
        <div className="bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 shadow-[0_0_50px_rgba(0,0,0,0.5)] min-w-[220px]">
          <div className="mb-4 pb-4 border-b border-white/5">
            <Link 
              href="/"
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors group/home"
            >
              <span className="text-xl">🏠</span>
              <span className="text-xs font-bold text-zinc-400 group-hover:text-white transition-colors tracking-wide">ARCADE HOME</span>
            </Link>
          </div>

          <div className="space-y-1">
            {games.map((game) => (
              <Link
                key={game.href}
                href={game.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 group/link ${
                  pathname === game.href ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                <span className="text-xl transition-transform duration-300 group-hover/link:scale-125 filter grayscale group-hover/link:grayscale-0">
                  {game.icon}
                </span>
                <span className={`text-xs font-bold tracking-wide transition-colors ${
                  pathname === game.href ? game.color : 'text-zinc-500 group-hover:text-zinc-200'
                }`}>
                  {game.name}
                </span>
                {pathname === game.href && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
                )}
              </Link>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-white/5">
             <div className="px-3 py-1">
                <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest text-center">
                   System v2.0
                </p>
             </div>
          </div>
        </div>
      </div>
      
      {/* Label (Visible when collapsed) */}
      {!isOpen && (
        <div className="absolute left-14 top-1/2 -translate-y-1/2 px-3 py-1 bg-white/10 backdrop-blur-md text-white text-[10px] font-bold rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10">
           Switch Game
        </div>
      )}
    </div>
  );
};

export default ArcadeNav;
