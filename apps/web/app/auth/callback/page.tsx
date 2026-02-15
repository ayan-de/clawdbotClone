"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import OrbitSystem from "../../components/OrbitSystem";

type ApiResponse = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  picture?: string;
  telegramUsername?: string;
  telegramId?: number;
  selectedAiProvider?: "openai" | "claude" | "ollama";
};

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [user, setUser] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stars, setStars] = useState<
    { id: number; top: string; left: string; size: string; duration: string }[]
  >([]);

  useEffect(() => {
    // Initialize stars
    const newStars = Array.from({ length: 150 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 2 + 1}px`,
      duration: `${Math.random() * 3 + 2}s`,
    }));
    setStars(newStars);

    // Fetch user data
    if (token) {
      fetchUserData(token);
    } else {
      setError("No authentication token found");
      setLoading(false);
    }
  }, [token]);

  const fetchUserData = async (authToken: string) => {
    try {
      const response = await fetch("http://localhost:5000/users/me", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }

      const data: ApiResponse = await response.json();
      setUser(data);
      setLoading(false);

      // Store token in localStorage
      localStorage.setItem("orbit_token", authToken);
    } catch (err: any) {
      setError(err.message || "Failed to authenticate");
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("orbit_token");
    router.push("/");
  };

  const handleSignup = () => {
    router.push(`/signup?token=${token}`);
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
            <span className="font-bold text-white tracking-[0.2em] tui-glow">
              [ ORBIT ]
            </span>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-xs text-white/60">
                {user.displayName || user.email}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="text-xs border border-white/20 px-4 py-2 hover:bg-white hover:text-black transition-all uppercase tracking-tighter"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-20 flex flex-col items-center justify-center px-4 py-20 max-w-2xl mx-auto min-h-[80vh]">
        {loading ? (
          <div className="text-white">Loading...</div>
        ) : error ? (
          <div className="border-2 border-red-500/30 bg-black/90 p-8 text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="text-xs border border-white/20 px-4 py-2 hover:bg-white hover:text-black transition-all uppercase tracking-tighter"
            >
              Back to Home
            </button>
          </div>
        ) : user ? (
          <div className="w-full space-y-6">
            {/* User Profile Card */}
            <div className="w-full border-2 border-white/10 bg-black/90 p-6 relative shadow-[0_0_50px_rgba(255,255,255,0.1)] backdrop-blur-xl">
              <div className="bg-white/10 px-4 py-2 text-[10px] uppercase tracking-widest mb-4">
                User Profile
              </div>

              <div className="flex items-center gap-4 mb-6">
                {user.picture && (
                  <img
                    src={user.picture}
                    alt={user.displayName || user.email}
                    className="w-16 h-16 rounded-full border-2 border-white/20"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {user.displayName ||
                      `${user.firstName} ${user.lastName}`.trim() ||
                      user.email}
                  </h2>
                  <p className="text-xs text-white/60">{user.email}</p>
                </div>
              </div>

              {/* Telegram Status */}
              <div className="border border-white/20 p-4 bg-white/5">
                <p className="text-xs uppercase tracking-widest text-white/60 mb-2">
                  Telegram Connection
                </p>
                {user.telegramUsername ? (
                  <div className="flex items-center gap-2 text-green-400">
                    <span className="text-xl">●</span>
                    <span className="text-sm">@{user.telegramUsername}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-yellow-400">
                    <span className="text-xl">○</span>
                    <span className="text-sm">Not connected</span>
                  </div>
                )}
              </div>

              {/* Footer Decoration */}
              <div className="absolute -bottom-2 -right-2 w-12 h-12 border-b-2 border-r-2 border-white/40 pointer-events-none"></div>
              <div className="absolute -top-2 -left-2 w-12 h-12 border-t-2 border-l-2 border-white/40 pointer-events-none"></div>
            </div>

            {/* Action Buttons */}
            {!user.telegramUsername && (
              <button
                onClick={handleSignup}
                className="w-full px-6 py-3 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-white/80 transition-all active:scale-95"
              >
                Connect Telegram
              </button>
            )}

            {/* Instructions Card */}
            <div className="w-full border-2 border-white/10 bg-black/90 p-6 relative shadow-[0_0_50px_rgba(255,255,255,0.1)] backdrop-blur-xl">
              <div className="bg-white/10 px-4 py-2 text-[10px] uppercase tracking-widest mb-4">
                How to Use Orbit
              </div>

              <div className="space-y-3 text-xs text-white/80">
                <p className="flex items-start gap-2">
                  <span className="text-white font-bold">1.</span>
                  <span>Connect your Telegram account above</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-white font-bold">2.</span>
                  <span>Start the Orbit TUI client on your desktop</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-white font-bold">3.</span>
                  <span>Send commands to the Telegram bot</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-white font-bold">4.</span>
                  <span>Commands will execute on your connected desktop</span>
                </p>
              </div>

              {/* Footer Decoration */}
              <div className="absolute -bottom-2 -right-2 w-12 h-12 border-b-2 border-r-2 border-white/40 pointer-events-none"></div>
              <div className="absolute -top-2 -left-2 w-12 h-12 border-t-2 border-l-2 border-white/40 pointer-events-none"></div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
