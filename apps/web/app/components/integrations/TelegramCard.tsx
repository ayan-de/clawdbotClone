"use client";

import { FaTelegram } from "react-icons/fa";
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
  const telegramColorGlow = "rgba(0, 136, 204, 0.5)";

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-3">
            <FaTelegram className="text-lg" style={{ color: telegramColor }} />
            <span>Integration::Telegram</span>
            <div className="flex-1" />
            <div
              className={`flex items-center gap-2 text-[10px] uppercase tracking-widest ${
                isConnected ? "text-green-500/80" : "text-yellow-500/80"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected
                    ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse"
                    : "bg-yellow-500/50"
                }`}
              />
              {isConnected ? "Connected" : "Disconnected"}
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        <p className="text-xs text-white/60 leading-relaxed">
          Connect your Telegram account to send and receive commands through
          the Orbit Bot.
        </p>

        {/* Connection Details */}
        {isConnected && username && (
          <div
            className="border p-4 relative"
            style={{
              backgroundColor: telegramColorLight,
              borderColor: telegramColorBorder,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaTelegram style={{ color: telegramColor }} />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">
                    Linked Account
                  </p>
                  <p className="text-sm font-bold text-white tracking-tight">
                    @{username}
                  </p>
                </div>
              </div>
            </div>
            <div
              className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: telegramColor }}
            />
          </div>
        )}

        {!isConnected && (
          <div className="border border-white/20 p-4 bg-white/5">
            <div className="space-y-2 text-[10px] text-white/80">
              <p>
                <strong className="text-white">Step 1:</strong> Open Telegram
                and find your username
              </p>
              <p>
                <strong className="text-white">Step 2:</strong> Go to Settings →
                Username
              </p>
              <p>
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
            className="w-full"
            style={{ backgroundColor: telegramColor, color: "white" }}
          >
            Connect Telegram
          </Button>
        )}

        {isConnected && (
          <>
            <Button
              onClick={onAuthorizeDesktop}
              loading={loading}
              className="w-full"
              style={{ backgroundColor: telegramColor, color: "white" }}
            >
              Authorize Desktop
            </Button>
            <Button
              variant="outline"
              onClick={onDisconnect}
              loading={loading}
              className="w-full"
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
