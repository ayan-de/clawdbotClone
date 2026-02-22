"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import OrbitSystem from "../components/OrbitSystem";
import { API_URL } from "../config";
import { TelegramCard } from "../components/integrations/TelegramCard";
import { EmailCard } from "../components/integrations/EmailCard";
import { Button } from "../components/ui/button";
import { SearchInput } from "../components/ui/search-input";

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

function DashboardContent() {
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
      // Try to get token from localStorage
      const savedToken = localStorage.getItem("orbit_token");
      if (savedToken) {
        fetchUserData(savedToken);
      } else {
        setError("No authentication token found");
        setLoading(false);
      }
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

      // Clear token from URL for security (one-time use)
      const url = new URL(window.location.href);
      url.searchParams.delete("token");
      window.history.replaceState({}, "", url.toString());
    } catch (err: any) {
      setError(err.message || "Failed to authenticate");
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("orbit_token");
    router.push("/");
  };

  // Telegram actions
  const handleConnectTelegram = () => {
    router.push(`/signup?token=${localStorage.getItem("orbit_token")}`);
  };

  const handleDisconnectTelegram = async () => {
    const authToken = localStorage.getItem("orbit_token");
    if (!authToken) return;

    try {
      const response = await fetch(`${API_URL}/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          telegramUsername: null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to disconnect Telegram");
      }

      const data: ApiResponse = await response.json();
      setUser(data);
    } catch (err: any) {
      setError(err.message || "Failed to disconnect Telegram");
    }
  };

  const generateDesktopToken = async () => {
    const authToken = localStorage.getItem("orbit_token");
    if (!authToken) return;

    setGeneratingToken(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/desktop/tokens`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
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

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

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
            <div className="hidden md:flex items-center gap-6 text-xs uppercase tracking-widest text-white/50">
              <a href="#" className="hover:text-white transition-colors">Mission</a>
              <a href="#" className="hover:text-white transition-colors">Nodes</a>
              <a href="#" className="hover:text-white transition-colors">Archive</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-xs text-white/60">
                {user.displayName || user.email}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <main className="relative z-20 px-4 py-20 max-w-7xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-white font-mono text-sm tracking-widest animate-pulse">
              [ INITIALIZING_DASHBOARD... ]
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="border-2 border-red-500/30 bg-black/90 p-8 text-center backdrop-blur-xl relative max-w-md">
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50"></div>
              <p className="text-red-400 mb-6 font-mono text-sm uppercase tracking-tighter">{error}</p>
              <Button variant="outline" onClick={() => router.push("/")}>
                Return::Home
              </Button>
            </div>
          </div>
        ) : user ? (
          <div className="space-y-12">
            {/* Dashboard Header */}
            <div className="text-center space-y-4 mb-12">
              <div className="inline-block border border-white/20 px-3 py-1 text-[10px] uppercase tracking-[0.3em] bg-black/50 backdrop-blur-sm">
                System::Dashboard
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tighter uppercase text-white">
                Integrations Control Panel
              </h1>
              <p className="text-sm text-white/60 max-w-xl mx-auto">
                Manage your connected services and authorize desktop clients for
                secure terminal access.
              </p>
            </div>

            {/* User Profile Summary */}
            <div className="max-w-2xl mx-auto">
              <div className="border-2 border-white/10 bg-black/90 p-6 relative backdrop-blur-xl">
                <div className="flex items-center gap-6">
                  {user.picture && (
                    <img
                      src={user.picture}
                      alt={user.displayName || user.email}
                      className="w-16 h-16 border-2 border-white/20 p-1"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tighter uppercase">
                      {user.displayName ||
                        `${user.firstName} ${user.lastName}`.trim() ||
                        user.email}
                    </h2>
                    <p className="text-xs text-white/40 font-mono mt-1 italic">
                      {user.email}
                    </p>
                    <p className="text-[10px] text-white/20 mt-2 uppercase tracking-widest">
                      ID: {user.id.substring(0, 8)}...
                    </p>
                  </div>
                </div>
                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-2 border-l-2 border-white/40 pointer-events-none" />
                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-2 border-r-2 border-white/40 pointer-events-none" />
              </div>
            </div>

            {/* Search Bar */}
            <div className="max-w-4xl mx-auto mb-12">
              <div className="flex gap-4">
                <div className="flex-1">
                  <SearchInput
                    placeholder="Search integrations..."
                    onSearch={setSearchQuery}
                    className="w-full"
                  />
                </div>
                <Button variant="default" className="cursor-pointer">
                  Add Integration
                </Button>
              </div>
            </div>

            {/* Integration Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(() => {
                // Available integrations data - defined here to ensure user is available
                const integrations = [
                  {
                    id: "telegram",
                    name: "Telegram",
                    component: (
                      <TelegramCard
                        key="telegram"
                        isConnected={!!user.telegramUsername}
                        username={user.telegramUsername}
                        onConnect={handleConnectTelegram}
                        onDisconnect={handleDisconnectTelegram}
                        onAuthorizeDesktop={generateDesktopToken}
                        loading={generatingToken}
                      />
                    ),
                  },
                  {
                    id: "email",
                    name: "Email",
                    component: <EmailCard key="email" />,
                  },
                ];

                // Filter integrations based on search query
                const filteredIntegrations = integrations.filter((integration) =>
                  integration.name.toLowerCase().includes(searchQuery.toLowerCase())
                );

                return filteredIntegrations.length > 0 ? (
                  filteredIntegrations.map((integration) => integration.component)
                ) : (
                  <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12">
                    <p className="text-white/40 text-sm uppercase tracking-widest">
                      [ No integrations found matching "{searchQuery}" ]
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>
        ) : null}
      </main>

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
              <Button variant="default" onClick={handleCopyToken} className="w-full">
                Capture::Copy
              </Button>
            </div>

            {/* Footer Decoration */}
            <div className="absolute -bottom-2 -right-2 w-12 h-12 border-b-2 border-r-2 border-white/40 pointer-events-none"></div>
            <div className="absolute -top-2 -left-2 w-12 h-12 border-t-2 border-l-2 border-white/40 pointer-events-none"></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center font-mono text-white/40 text-[10px] uppercase tracking-[0.5em] animate-pulse">
        [ LOADING_ORBIT_SYSTEM... ]
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
