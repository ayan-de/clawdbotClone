"use client";

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../ui/card";
import { Button } from "../ui/button";

export interface TeamsCardProps {
  isConnected: boolean;
  email?: string;
  onConnect: () => void;
  onDisconnect: () => void;
  loading?: boolean;
}

/**
 * Microsoft Teams Integration Card Component
 * Displays connection status and actions for Teams integration
 */
export function TeamsCard({
  isConnected,
  email,
  onConnect,
  onDisconnect,
  loading = false,
}: TeamsCardProps) {
  const teamsColor = "#6264a7";
  const teamsColorLight = "rgba(98, 100, 167, 0.1)";
  const teamsColorBorder = "rgba(98, 100, 167, 0.3)";

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-3">
            <img
              src="https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/webp/microsoft-teams.webp"
              alt="Microsoft Teams"
              className="w-5 h-5"
            />
            <span>Integration::Microsoft Teams</span>
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
          Connect your Microsoft Teams account to send messages, create channels,
          and interact with your teams using Orbit AI.
        </p>

        {/* Connection Details */}
        {isConnected && email && (
          <div
            className="border p-4 relative"
            style={{
              backgroundColor: teamsColorLight,
              borderColor: teamsColorBorder,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/webp/microsoft-teams.webp"
                  alt="Microsoft Teams"
                  className="w-5 h-5"
                />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">
                    Linked Account
                  </p>
                  <p className="text-sm font-bold text-white tracking-tight">
                    {email}
                  </p>
                </div>
              </div>
            </div>
            <div
              className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: teamsColor }}
            />
          </div>
        )}

        {!isConnected && (
          <div className="border border-white/20 p-4 bg-white/5">
            <div className="space-y-2 text-[10px] text-white/80">
              <p>
                <strong className="text-white">How to connect Teams:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1 mt-2 ml-2">
                <li>Click the "Connect" button below</li>
                <li>You'll be redirected to Microsoft OAuth</li>
                <li>Authorize Orbit to access your Teams workspace</li>
                <li>You'll be redirected back with Teams connected</li>
              </ol>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-3">
        {!isConnected && (
          <Button
            onClick={onConnect}
            loading={loading}
            className="w-full cursor-pointer"
            style={{ backgroundColor: teamsColor, color: "white" }}
          >
            Connect Teams
          </Button>
        )}

        {isConnected && (
          <>
            <Button
              onClick={onConnect}
              loading={loading}
              className="w-full cursor-pointer"
              style={{ backgroundColor: teamsColor, color: "white" }}
            >
              Reauthorize Teams
            </Button>
            <Button
              variant="outline"
              onClick={onDisconnect}
              loading={loading}
              className="w-full cursor-pointer"
              style={{
                borderColor: teamsColorBorder,
                color: teamsColor,
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
