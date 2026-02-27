"use client";

import { FaBitbucket } from "react-icons/fa";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../ui/card";
import { Button } from "../ui/button";

export interface BitbucketCardProps {
  isConnected: boolean;
  username?: string;
  workspace?: string;
  onConnect: () => void;
  onDisconnect: () => void;
  loading?: boolean;
}

/**
 * Bitbucket Integration Card Component
 * Displays connection status and actions for Bitbucket integration
 */
export function BitbucketCard({
  isConnected,
  username,
  workspace,
  onConnect,
  onDisconnect,
  loading = false,
}: BitbucketCardProps) {
  const bitbucketColor = "#0052cc";
  const bitbucketColorLight = "rgba(0, 82, 204, 0.1)";
  const bitbucketColorBorder = "rgba(0, 82, 204, 0.3)";

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-3">
            <FaBitbucket className="text-lg" style={{ color: bitbucketColor }} />
            <span>Integration::Bitbucket</span>
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
          Connect your Bitbucket account to manage repositories, create pull
          requests, and track issues using Orbit AI.
        </p>

        {/* Connection Details */}
        {isConnected && (username || workspace) && (
          <div
            className="border p-4 relative"
            style={{
              backgroundColor: bitbucketColorLight,
              borderColor: bitbucketColorBorder,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaBitbucket style={{ color: bitbucketColor }} />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">
                    Linked Account
                  </p>
                  <p className="text-sm font-bold text-white tracking-tight">
                    {username || workspace}
                  </p>
                  {workspace && (
                    <p className="text-[10px] text-white/60 mt-1">
                      Workspace: {workspace}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div
              className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: bitbucketColor }}
            />
          </div>
        )}

        {!isConnected && (
          <div className="border border-white/20 p-4 bg-white/5">
            <div className="space-y-2 text-[10px] text-white/80">
              <p>
                <strong className="text-white">How to connect Bitbucket:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1 mt-2 ml-2">
                <li>Click the "Connect" button below</li>
                <li>You'll be redirected to Atlassian OAuth</li>
                <li>Authorize Orbit to access your repositories</li>
                <li>You'll be redirected back with Bitbucket connected</li>
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
            style={{ backgroundColor: bitbucketColor, color: "white" }}
          >
            Connect Bitbucket
          </Button>
        )}

        {isConnected && (
          <>
            <Button
              onClick={onConnect}
              loading={loading}
              className="w-full cursor-pointer"
              style={{ backgroundColor: bitbucketColor, color: "white" }}
            >
              Reauthorize Bitbucket
            </Button>
            <Button
              variant="outline"
              onClick={onDisconnect}
              loading={loading}
              className="w-full cursor-pointer"
              style={{
                borderColor: bitbucketColorBorder,
                color: bitbucketColor,
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
