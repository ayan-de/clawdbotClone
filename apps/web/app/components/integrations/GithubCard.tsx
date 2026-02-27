"use client";

import { FaGithub } from "react-icons/fa";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../ui/card";
import { Button } from "../ui/button";

export interface GithubCardProps {
  isConnected: boolean;
  username?: string;
  repositories?: number;
  onConnect: () => void;
  onDisconnect: () => void;
  loading?: boolean;
}

/**
 * GitHub Integration Card Component
 * Displays connection status and actions for GitHub integration
 */
export function GithubCard({
  isConnected,
  username,
  repositories,
  onConnect,
  onDisconnect,
  loading = false,
}: GithubCardProps) {
  const githubColor = "#24292e";
  const githubColorLight = "rgba(36, 41, 46, 0.1)";
  const githubColorBorder = "rgba(36, 41, 46, 0.3)";

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-3">
            <FaGithub className="text-lg" style={{ color: githubColor }} />
            <span>Integration::GitHub</span>
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
          Connect your GitHub account to manage repositories, create pull requests,
          track issues, and interact with your code using Orbit AI.
        </p>

        {/* Connection Details */}
        {isConnected && username && (
          <div
            className="border p-4 relative"
            style={{
              backgroundColor: githubColorLight,
              borderColor: githubColorBorder,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaGithub style={{ color: githubColor }} />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">
                    Linked Account
                  </p>
                  <p className="text-sm font-bold text-white tracking-tight">
                    @{username}
                  </p>
                  {repositories !== undefined && (
                    <p className="text-[10px] text-white/60 mt-1">
                      {repositories} repositories
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div
              className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: githubColor }}
            />
          </div>
        )}

        {!isConnected && (
          <div className="border border-white/20 p-4 bg-white/5">
            <div className="space-y-2 text-[10px] text-white/80">
              <p>
                <strong className="text-white">How to connect GitHub:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1 mt-2 ml-2">
                <li>Click the "Connect" button below</li>
                <li>You'll be redirected to GitHub OAuth</li>
                <li>Authorize Orbit to access your repositories</li>
                <li>You'll be redirected back with GitHub connected</li>
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
            style={{ backgroundColor: githubColor, color: "white" }}
          >
            Connect GitHub
          </Button>
        )}

        {isConnected && (
          <>
            <Button
              onClick={onConnect}
              loading={loading}
              className="w-full cursor-pointer"
              style={{ backgroundColor: githubColor, color: "white" }}
            >
              Reauthorize GitHub
            </Button>
            <Button
              variant="outline"
              onClick={onDisconnect}
              loading={loading}
              className="w-full cursor-pointer"
              style={{
                borderColor: githubColorBorder,
                color: githubColor,
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
