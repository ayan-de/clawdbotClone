"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../../components/Header";
import OrbitSystem from "../../components/OrbitSystem";
import { API_URL } from "../../config";

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

type DesktopTokenResponse = {
  token: string;
  displayToken: string;
  expiresAt: string;
  desktopName?: string;
  instructions: string;
  connectCommand: string;
};

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [user, setUser] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stars, setStars] = useState<
    { id: number; top: string; left: string; size: string; duration: string }[]
  >([]);

  // Desktop token state
  const [desktopToken, setDesktopToken] = useState<DesktopTokenResponse | null>(null);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);

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
      const response = await fetch(`${API_URL}/users/me`, {
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

  const generateDesktopToken = async () => {
    setGeneratingToken(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/desktop/tokens`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error("Failed to generate connection token");
      }

      const data: DesktopTokenResponse = await response.json();
      setDesktopToken(data);
      setShowTokenModal(true);
    } catch (err: any) {
      setError(err.message || "Failed to generate desktop token. Please try again.");
    } finally {
      setGeneratingToken(false);
    }
  };

  const handleCopyToken = () => {
    if (desktopToken) {
      navigator.clipboard.writeText(desktopToken.connectCommand);
      setTimeout(() => {
        setShowTokenModal(false);
      }, 2000);
    }
  };

  const formatExpirationTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString();
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
      <Header
        showUser={!!user}
        userName={user?.displayName || user?.email}
        onLogout={handleLogout}
      />

      <main className="relative z-20 flex flex-col items-center justify-center px-4 py-20 max-w-2xl mx-auto min-h-[80vh]">
        {loading ? (
          <div className="text-white font-mono text-sm tracking-widest animate-pulse">
            [ INITIALIZING_SESSION... ]
          </div>
        ) : error ? (
          <div className="border-2 border-red-500/30 bg-black/90 p-8 text-center backdrop-blur-xl relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50"></div>
            <p className="text-red-400 mb-6 font-mono text-sm uppercase tracking-tighter">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="text-xs border border-white/20 px-6 py-3 hover:bg-white hover:text-black transition-all uppercase tracking-widest font-bold"
            >
              Return::Home
            </button>
          </div>
        ) : user ? (
          <div className="w-full space-y-6">
            {/* User Profile Card */}
            <div className="w-full border-2 border-white/10 bg-black/90 p-6 relative shadow-[0_0_50px_rgba(255,255,255,0.1)] backdrop-blur-xl">
              <div className="bg-white/10 px-4 py-2 text-[10px] uppercase tracking-widest mb-4 flex justify-between">
                <span>User Profile</span>
                <span className="text-white/40">Status: Online</span>
              </div>

              <div className="flex items-center gap-6 mb-6">
                {user.picture && (
                  <img
                    src={user.picture}
                    alt={user.displayName || user.email}
                    className="w-20 h-20 rounded-none border-2 border-white/20 p-1"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tighter uppercase">
                    {user.displayName ||
                      `${user.firstName} ${user.lastName}`.trim() ||
                      user.email}
                  </h2>
                  <p className="text-xs text-white/40 font-mono mt-1 italic">{user.email}</p>
                  <p className="text-[10px] text-white/20 mt-2 uppercase tracking-widest">ID: {user.id.substring(0, 8)}...</p>
                </div>
              </div>

              {/* Telegram Status */}
              <div className="border border-white/20 p-4 bg-white/5 relative group">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-3">
                  Protocol::Messaging
                </p>
                {user.telegramUsername ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-white">
                      <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse"></div>
                      <span className="text-sm font-bold tracking-tight">@{user.telegramUsername}</span>
                    </div>
                    <span className="text-[10px] text-green-500/50 uppercase tracking-widest">Linked</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-white/40">
                      <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                      <span className="text-sm">Not synchronized</span>
                    </div>
                    <span className="text-[10px] text-yellow-500/50 uppercase tracking-widest">Idle</span>
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
                className="w-full px-6 py-4 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] hover:bg-white/80 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              >
                Sync::Telegram
              </button>
            )}

            {user.telegramUsername && (
              <button
                onClick={generateDesktopToken}
                disabled={generatingToken}
                className="w-full px-6 py-4 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] hover:bg-white/80 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              >
                {generatingToken ? "[ GENERATING_KEY... ]" : "Authorize::Desktop"}
              </button>
            )}

            {/* Instructions Card */}
            <div className="w-full border-2 border-white/10 bg-black/90 p-6 relative shadow-[0_0_50px_rgba(255,255,255,0.1)] backdrop-blur-xl">
              <div className="bg-white/10 px-4 py-2 text-[10px] uppercase tracking-widest mb-4">
                Operational Guide
              </div>

              <div className="space-y-4 text-xs text-white/60 leading-relaxed font-mono">
                <div className="flex items-start gap-3">
                  <span className="text-white font-bold">[01]</span>
                  <p>Link your <span className="text-white uppercase">Telegram Account</span> using the button above.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-white font-bold">[02]</span>
                  <p>Initialize the <span className="text-white uppercase">Orbit TUI</span> on your target machine.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-white font-bold">[03]</span>
                  <p>Transmit <span className="text-white uppercase">Commands</span> via the Telegram Bot terminal.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-white font-bold">[04]</span>
                  <p>Monitor <span className="text-white uppercase">Execution</span> in real-time on your remote node.</p>
                </div>
              </div>

              {/* Footer Decoration */}
              <div className="absolute -bottom-2 -right-2 w-12 h-12 border-b-2 border-r-2 border-white/40 pointer-events-none"></div>
              <div className="absolute -top-2 -left-2 w-12 h-12 border-t-2 border-l-2 border-white/40 pointer-events-none"></div>
            </div>
          </div>
        ) : null}

        {/* Desktop Token Modal */}
        {showTokenModal && desktopToken && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center px-4">
            <div className="w-full max-w-2xl border-2 border-white/20 bg-black/95 p-8 relative shadow-[0_0_100px_rgba(255,255,255,0.2)]">
              {/* Header */}
              <div className="bg-white/10 px-4 py-2 flex items-center justify-between text-[10px] uppercase tracking-widest mb-8">
                <span>Secure Connection Port</span>
                <button
                  onClick={() => setShowTokenModal(false)}
                  className="text-white/40 hover:text-white transition-colors text-lg"
                >
                  ×
                </button>
              </div>

              {/* Token Display */}
              <div className="space-y-8">
                {/* Token */}
                <div className="border border-white/20 p-6 bg-white/5 relative">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-4">
                    Access_Key
                  </p>
                  <div className="font-mono text-sm text-green-400 break-all p-4 bg-black/40 border-l-2 border-green-500/50">
                    {desktopToken.token}
                  </div>
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 animate-pulse"></div>
                </div>

                {/* Expiration */}
                <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-white/40 font-mono">
                  <span>TTL_EXPIRY:</span>
                  <span className="text-yellow-500/80">{formatExpirationTime(desktopToken.expiresAt)}</span>
                </div>

                {/* Instructions */}
                <div className="text-xs text-white/60 font-mono leading-relaxed border-l border-white/20 pl-4 py-2 italic text-[11px]">
                  <p>{desktopToken.instructions}</p>
                </div>

                {/* Connect Command */}
                <div className="border border-white/20 p-6 bg-black">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-4">
                    TUI_START_COMMAND
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-white animate-pulse">❯</span>
                    <code className="text-xs text-white block break-all font-mono leading-loose">
                      {desktopToken.connectCommand}
                    </code>
                  </div>
                </div>

                {/* Copy Button */}
                <button
                  onClick={handleCopyToken}
                  className="w-full px-6 py-4 bg-white text-black text-xs font-bold uppercase tracking-[0.3em] hover:bg-white/80 transition-all active:scale-[0.98]"
                >
                  Capture::Copy
                </button>
              </div>

              {/* Footer Decoration */}
              <div className="absolute -bottom-2 -right-2 w-12 h-12 border-b-2 border-r-2 border-white/40 pointer-events-none"></div>
              <div className="absolute -top-2 -left-2 w-12 h-12 border-t-2 border-l-2 border-white/40 pointer-events-none"></div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center font-mono text-white/40 text-[10px] uppercase tracking-[0.5em] animate-pulse">
        [ LOADING_ORBIT_SYSTEM... ]
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
