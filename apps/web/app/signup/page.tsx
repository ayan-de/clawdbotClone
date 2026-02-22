"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../components/Header";
import OrbitSystem from "../components/OrbitSystem";
import { API_URL } from "../config";

type ApiResponse = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  telegramUsername?: string;
  telegramId?: number;
  selectedAiProvider?: "openai" | "claude" | "ollama";
};

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [telegramUsername, setTelegramUsername] = useState("");
  const [loading, setLoading] = useState(false);
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

    // Check if token exists
    if (!token) {
      setError("Authentication token not found. Please login again.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          telegramUsername: telegramUsername.startsWith("@")
            ? telegramUsername.substring(1)
            : telegramUsername,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      const data: ApiResponse = await response.json();

      // Redirect to dashboard with token
      router.push(`/dashboard?token=${token}`);
    } catch (err: any) {
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
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

      {/* Header */}
      <Header />

      <main className="relative z-20 flex flex-col items-center justify-center px-4 py-20 max-w-2xl mx-auto min-h-[80vh]">
        {/* Signup Form Container */}
        <div className="w-full border-2 border-white/10 bg-black/90 p-8 relative shadow-[0_0_50px_rgba(255,255,255,0.1)] backdrop-blur-xl">
          {/* Header */}
          <div className="bg-white/10 px-4 py-2 flex items-center justify-between text-[10px] uppercase tracking-widest mb-6">
            <span>Setup::Telegram</span>
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-white/20"></div>
              <div className="w-2 h-2 rounded-full bg-white/20"></div>
              <div className="w-2 h-2 rounded-full bg-white/20"></div>
            </div>
          </div>

          {/* Form Content */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tighter uppercase mb-4 text-white">
                Complete Your Setup
              </h1>
              <p className="text-sm text-white/60 mb-6 leading-relaxed">
                Connect your Telegram account to start receiving commands on your
                desktop.
              </p>
            </div>

            {/* Instructions */}
            <div className="border border-white/20 p-4 bg-white/5 mb-6">
              <p className="text-xs text-white/80 mb-2">
                <strong className="text-white">Step 1:</strong> Open Telegram and
                find your username
              </p>
              <p className="text-xs text-white/80 mb-2">
                <strong className="text-white">Step 2:</strong> Go to Settings →
                Username
              </p>
              <p className="text-xs text-white/80">
                <strong className="text-white">Step 3:</strong> Enter your username
                below (without the @ symbol)
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="telegramUsername"
                  className="block text-xs uppercase tracking-widest text-white/60 mb-2"
                >
                  Telegram Username
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
                    @
                  </span>
                  <input
                    type="text"
                    id="telegramUsername"
                    value={telegramUsername}
                    onChange={(e) => setTelegramUsername(e.target.value)}
                    className="w-full bg-black/50 border border-white/20 px-4 py-3 pl-8 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/50 transition-colors"
                    placeholder="your_username"
                    required
                    pattern="^[a-zA-Z0-9_]{5,32}$"
                    title="Telegram username must be 5-32 characters and contain only letters, numbers, and underscores"
                  />
                </div>
                <p className="text-[10px] text-white/40 mt-2">
                  5-32 characters, letters, numbers, and underscores only
                </p>
              </div>

              {error && (
                <div className="border border-red-500/50 bg-red-500/10 p-3 text-xs text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full px-6 py-3 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-white/80 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : "Connect Telegram"}
              </button>
            </form>

            {/* Footer Decoration */}
            <div className="absolute -bottom-2 -right-2 w-12 h-12 border-b-2 border-r-2 border-white/40 pointer-events-none"></div>
            <div className="absolute -top-2 -left-2 w-12 h-12 border-t-2 border-l-2 border-white/40 pointer-events-none"></div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center font-mono text-white/40 text-[10px] uppercase tracking-[0.5em] animate-pulse">
        [ LOADING_SETUP_SYSTEM... ]
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}
