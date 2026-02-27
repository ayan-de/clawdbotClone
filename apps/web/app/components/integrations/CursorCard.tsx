"use client";

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../ui/card";
import { Button } from "../ui/button";

export interface CursorCardProps {
  isConnected: boolean;
  workspacePath?: string;
  projectCount?: number;
  onConnect: () => void;
  onDisconnect: () => void;
  loading?: boolean;
}

/**
 * Cursor Editor Integration Card Component
 * Displays connection status and actions for Cursor Editor integration
 */
export function CursorCard({
  isConnected,
  workspacePath,
  projectCount,
  onConnect,
  onDisconnect,
  loading = false,
}: CursorCardProps) {
  const cursorColor = "#007acc";
  const cursorColorLight = "rgba(0, 122, 204, 0.1)";
  const cursorColorBorder = "rgba(0, 122, 204, 0.3)";

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-3">
            <img
              src="/cursor.webp"
              alt="Cursor Editor"
              className="w-5 h-5"
            />
            <span>Integration::Cursor Editor</span>
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
          Connect Cursor Editor to execute code commands, manage workspaces, and
          interact with your codebase through Orbit AI.
        </p>

        {/* Connection Details */}
        {isConnected && (workspacePath || projectCount) && (
          <div
            className="border p-4 relative"
            style={{
              backgroundColor: cursorColorLight,
              borderColor: cursorColorBorder,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="/cursor.webp"
                  alt="Cursor Editor"
                  className="w-5 h-5"
                />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">
                    Workspace
                  </p>
                  <p className="text-sm font-bold text-white tracking-tight truncate max-w-[200px]">
                    {workspacePath || "Cursor Editor Connected"}
                  </p>
                  {projectCount !== undefined && (
                    <p className="text-[10px] text-white/60 mt-1">
                      {projectCount} active project(s)
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div
              className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: cursorColor }}
            />
          </div>
        )}

        {!isConnected && (
          <div className="border border-white/20 p-4 bg-white/5">
            <div className="space-y-2 text-[10px] text-white/80">
              <p>
                <strong className="text-white">How to connect Cursor:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1 mt-2 ml-2">
                <li>Install the Orbit extension for Cursor</li>
                <li>Open Cursor and navigate to Extensions</li>
                <li>Click "Connect Orbit" and authorize</li>
                <li>Your Cursor workspace will be synced with Orbit</li>
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
            style={{ backgroundColor: cursorColor, color: "white" }}
          >
            Connect Cursor
          </Button>
        )}

        {isConnected && (
          <>
            <Button
              onClick={onConnect}
              loading={loading}
              className="w-full cursor-pointer"
              style={{ backgroundColor: cursorColor, color: "white" }}
            >
              Sync Workspace
            </Button>
            <Button
              variant="outline"
              onClick={onDisconnect}
              loading={loading}
              className="w-full cursor-pointer"
              style={{
                borderColor: cursorColorBorder,
                color: cursorColor,
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
