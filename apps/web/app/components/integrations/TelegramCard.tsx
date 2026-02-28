"use client";

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../ui/card";
import { Button } from "../ui/button";

export interface TelegramCardProps {
  isConnected: boolean;
  username?: string;
  onConnect: () => void;
  onDisconnect: () => void;
  onAuthorizeDesktop: () => void;
  loading?: boolean;
}

/**
 * Telegram Integration Card Component
 * Displays connection status and actions for Telegram integration
 */
export function TelegramCard({
  isConnected,
  username,
  onConnect,
  onDisconnect,
  onAuthorizeDesktop,
  loading = false,
}: TelegramCardProps) {
  const telegramColor = "#0088cc";
  const telegramColorLight = "rgba(0, 136, 204, 0.1)";
  const telegramColorBorder = "rgba(0, 136, 204, 0.3)";

  return (
    <Card className="group">
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-3">
            <img
              src="https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/webp/telegram.webp"
              alt="Telegram"
              className="w-5 h-5"
            />
            <span className="space-glow">Integration::Telegram</span>
            <div className="flex-1" />
            <div
              className={`flex items-center gap-2 text-[10px] uppercase tracking-widest ${
                isConnected ? "text-green-500/80" : "text-yellow-500/80"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected
                    ? "status-pulse bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]"
                    : "bg-yellow-500/50"
                }`}
              />
              <span className="transition-opacity duration-300">
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        <p className="text-xs text-white/60 leading-relaxed">
          Connect your Telegram account to send and receive commands through
          Orbit Bot.
        </p>

        {/* Connection Details */}
        {isConnected && username && (
          <div
            className="border p-4 relative overflow-hidden transition-all duration-300 hover:scale-[1.02]"
            style={{
              backgroundColor: telegramColorLight,
              borderColor: telegramColorBorder,
              boxShadow: `0 0 20px ${telegramColor}20`,
            }}
          >
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <img
                  src="https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/webp/telegram.webp"
                  alt="Telegram"
                  className="w-5 h-5"
                />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">
                    Linked Account
                  </p>
                  <p className="text-sm font-bold text-white tracking-tight space-glow">
                    @{username}
                  </p>
                </div>
              </div>
            </div>
            <div
              className="absolute -top-1 -right-1 w-2 h-2 rounded-full status-pulse"
              style={{ backgroundColor: telegramColor }}
            />
            {/* Subtle gradient overlay */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                background: `radial-gradient(circle at top right, ${telegramColor}40, transparent)`,
              }}
            />
          </div>
        )}

        {!isConnected && (
          <div className="border border-white/20 p-4 bg-white/5 backdrop-blur-sm">
            <div className="space-y-2 text-[10px] text-white/80">
              <p>
                <strong className="text-white cursor-blink">❯</strong>{" "}
                <strong className="text-white">Step 1:</strong> Open Telegram and
                find your username
              </p>
              <p>
                <strong className="text-white cursor-blink">❯</strong>{" "}
                <strong className="text-white">Step 2:</strong> Go to Settings →
                Username
              </p>
              <p>
                <strong className="text-white cursor-blink">❯</strong>{" "}
                <strong className="text-white">Step 3:</strong> Enter your
                username when connecting
              </p>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-3">
        {!isConnected && (
          <Button
            onClick={onConnect}
            loading={loading}
            className="w-full cursor-pointer transition-all duration-300 hover:scale-[1.02]"
            style={{
              backgroundColor: telegramColor,
              color: "white",
              boxShadow: `0 0 20px ${telegramColor}40`,
            }}
          >
            Connect Telegram
          </Button>
        )}

        {isConnected && (
          <>
            <Button
              onClick={onAuthorizeDesktop}
              loading={loading}
              className="w-full cursor-pointer transition-all duration-300 hover:scale-[1.02]"
              style={{
                backgroundColor: telegramColor,
                color: "white",
                boxShadow: `0 0 20px ${telegramColor}40`,
              }}
            >
              Authorize Desktop
            </Button>
            <Button
              variant="outline"
              onClick={onDisconnect}
              loading={loading}
              className="w-full cursor-pointer transition-all duration-300 hover:scale-[1.02]"
              style={{
                borderColor: telegramColorBorder,
                color: telegramColor,
              }}
            >
              Disconnect
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
