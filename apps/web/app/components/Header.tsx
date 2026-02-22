"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "../config";
import { Button } from "./ui/button";

export interface HeaderProps {
  showUser?: boolean;
  userName?: string;
  onLogout?: () => void;
}

export default function Header({
  showUser = false,
  userName,
  onLogout,
}: HeaderProps) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("orbit_token");
    setIsLoggedIn(!!token);
  }, []);

  return (
    <nav className="border-b-2 border-white/20 px-6 py-4 backdrop-blur-md relative z-20">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <button
            onClick={() => router.push("/")}
            className="font-bold text-white tracking-[0.2em] tui-glow hover:text-white/80 transition-colors cursor-pointer"
          >
            [ ORBIT ]
          </button>
          <div className="hidden md:flex items-center gap-6 text-xs uppercase tracking-widest text-white/50">
            <a href="#" className="hover:text-white transition-colors">
              Mission
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Nodes
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Archive
            </a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {showUser && userName && (
            <span className="text-xs text-white/60">{userName}</span>
          )}
          {isLoggedIn && onLogout ? (
            <Button variant="outline" size="sm" onClick={onLogout}>
              Logout
            </Button>
          ) : isLoggedIn ? (
            <button
              onClick={() => router.push("/dashboard")}
              className="text-xs border border-white/20 px-4 py-2 hover:bg-white hover:text-black transition-all uppercase tracking-tighter cursor-pointer"
            >
              Dashboard
            </button>
          ) : (
            <a
              href={`${API_URL}/auth/google`}
              className="text-xs border border-white/20 px-4 py-2 hover:bg-white hover:text-black transition-all uppercase tracking-tighter cursor-pointer"
            >
              Login::Google
            </a>
          )}
        </div>
      </div>
    </nav>
  );
}
