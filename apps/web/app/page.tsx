"use client";

import { useState, useEffect } from "react";

import OrbitSystem from "./components/OrbitSystem";

export default function Home() {
  const [copied, setCopied] = useState(false);
  const [asciiLogo, setAsciiLogo] = useState("");
  const command = "curl -fsSL https://orbit.ayande.xyz/install.sh | bash";
  const [stars, setStars] = useState<{ id: number; top: string; left: string; size: string; duration: string }[]>([]);

  useEffect(() => {
    // Fetch logo from public/logo.txt
    fetch("/logo.txt")
      .then((res) => res.text())
      .then((text) => setAsciiLogo(text));

    const newStars = Array.from({ length: 150 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 2 + 1}px`,
      duration: `${Math.random() * 3 + 2}s`,
    }));
    setStars(newStars);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen selection:bg-white selection:text-black font-mono overflow-hidden relative">
      <div className="starfield">
        {stars.map((star) => (
          <div
            key={star.id}
            className="star"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              "--duration": star.duration,
            } as any}
          />
        ))}
      </div>
      <div className="scanlines" />
      
      {/* Planetary System Background */}
      <OrbitSystem />

      {/* TUI Navigation */}
      <nav className="border-b-2 border-white/20 px-6 py-4 backdrop-blur-md relative z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="font-bold text-white tracking-[0.2em] tui-glow">[ ORBIT ]</span>
            <div className="hidden md:flex items-center gap-6 text-xs uppercase tracking-widest text-white/50">
              <a href="#" className="hover:text-white transition-colors">Mission</a>
              <a href="#" className="hover:text-white transition-colors">Nodes</a>
              <a href="#" className="hover:text-white transition-colors">Archive</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-xs border border-white/20 px-4 py-2 hover:bg-white hover:text-black transition-all uppercase tracking-tighter">
              Login::Guest
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-20 flex flex-col items-center justify-center px-4 pt-8 pb-32 max-w-5xl mx-auto min-h-[90vh]">
        
        {/* ASCII Logo */}
        <div className="mb-8 scale-75 md:scale-100 opacity-80 hover:opacity-100 transition-opacity">
          <pre className="text-[0.5rem] sm:text-[0.6rem] md:text-xs text-white tui-glow animate-pulse leading-[1] tracking-normal whitespace-pre">
            {asciiLogo}
          </pre>
        </div>

        {/* Hero TUI */}
        <div className="text-center mb-16 space-y-6 relative">
          <div className="inline-block border border-white/20 px-3 py-1 text-[10px] uppercase tracking-[0.3em] bg-black/50 backdrop-blur-sm mb-4">
             System Status: Synchronizing...
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase mb-4 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50">
            Unified the gravity <br/> of your engineering stack.
          </h1>
          <p className="text-sm md:text-base text-white/60 max-w-xl mx-auto leading-relaxed border-l-2 border-white/20 pl-6 text-left italic bg-black/30 backdrop-blur-sm p-4 rounded-r-lg">
            "Orbit provides the infrastructure to build, scale, and deploy autonomous systems across the terminal galaxy. Zero friction. Total control."
          </p>
        </div>

        {/* Console Box */}
        <div className="w-full max-w-3xl border-2 border-white/10 bg-black/90 p-1 relative shadow-[0_0_50px_rgba(255,255,255,0.1)] backdrop-blur-xl">
          {/* Header */}
          <div className="bg-white/10 px-4 py-1 flex items-center justify-between text-[10px] uppercase tracking-widest mb-1">
            <span>Terminal::sh</span>
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-white/20"></div>
              <div className="w-2 h-2 rounded-full bg-white/20"></div>
              <div className="w-2 h-2 rounded-full bg-white/20"></div>
            </div>
          </div>

          <div className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 font-mono text-sm overflow-x-auto w-full">
              <div className="flex items-center gap-3">
                <span className="text-white animate-pulse">❯</span>
                <code className="whitespace-nowrap">
                  <span className="text-white font-bold">curl</span>
                  <span className="text-white/60 mx-2">-fsSL</span>
                  <span className="text-white">https://orbit.ayande.xyz/install.sh</span>
                  <span className="text-white/30 mx-2">|</span>
                  <span className="text-white italic">bash</span>
                </code>
              </div>
            </div>

            <button 
              onClick={handleCopy}
              className="w-full md:w-auto px-6 py-3 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-white/80 transition-all active:scale-95"
            >
              {copied ? "Command Captured" : "Initialize Orbit"}
            </button>
          </div>

          {/* Footer Decoration */}
          <div className="absolute -bottom-2 -right-2 w-12 h-12 border-b-2 border-r-2 border-white/40 pointer-events-none"></div>
          <div className="absolute -top-2 -left-2 w-12 h-12 border-t-2 border-l-2 border-white/40 pointer-events-none"></div>
        </div>

        {/* System Logs / Footer */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 w-full border-t border-white/10 pt-12 text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold bg-black/50 backdrop-blur-sm p-8">
          <div className="space-y-2">
            <p className="text-white/60">:: CONNECTION</p>
            <p>Protocol: SSH/V2</p>
            <p>Port: 443</p>
          </div>
          <div className="space-y-2">
            <p className="text-white/60">:: LOCAL_TIME</p>
            <p>{new Date().toISOString()}</p>
            <p>UTC/GMT +0</p>
          </div>
          <div className="space-y-2">
            <p className="text-white/60">:: SOURCE</p>
            <p className="hover:text-white cursor-pointer transition-colors underline underline-offset-4">Read_Docs.md</p>
            <p className="hover:text-white cursor-pointer transition-colors underline underline-offset-4">GitHub.src</p>
          </div>
        </div>

      </main>
    </div>
  );
}
