"use client";

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../ui/card";
import { Button } from "../ui/button";

export interface JiraCardProps {
  isConnected: boolean;
  workspaceUrl?: string;
  username?: string;
  onConnect: () => void;
  onDisconnect: () => void;
  loading?: boolean;
}

/**
 * Jira Integration Card Component
 * Displays connection status and actions for Jira integration
 */
export function JiraCard({
  isConnected,
  workspaceUrl,
  username,
  onConnect,
  onDisconnect,
  loading = false,
}: JiraCardProps) {
  const jiraColor = "#0052cc";
  const jiraColorLight = "rgba(0, 82, 204, 0.1)";
  const jiraColorBorder = "rgba(0, 82, 204, 0.3)";

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-3">
            <img
              src="https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/webp/jira.webp"
              alt="Jira"
              className="w-5 h-5"
            />
            <span>Integration::Jira</span>
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
          Connect your Jira workspace to create issues, update tickets, and manage
          your project boards using Orbit AI.
        </p>

        {/* Connection Details */}
        {isConnected && (workspaceUrl || username) && (
          <div
            className="border p-4 relative"
            style={{
              backgroundColor: jiraColorLight,
              borderColor: jiraColorBorder,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/webp/jira.webp"
                  alt="Jira"
                  className="w-5 h-5"
                />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">
                    Linked Workspace
                  </p>
                  <p className="text-sm font-bold text-white tracking-tight">
                    {username || workspaceUrl}
                  </p>
                  {workspaceUrl && (
                    <p className="text-[10px] text-white/60 mt-1">
                      {workspaceUrl}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div
              className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: jiraColor }}
            />
          </div>
        )}

        {!isConnected && (
          <div className="border border-white/20 p-4 bg-white/5">
            <div className="space-y-2 text-[10px] text-white/80">
              <p>
                <strong className="text-white">How to connect Jira:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1 mt-2 ml-2">
                <li>Click the "Connect" button below</li>
                <li>You'll be redirected to Atlassian OAuth</li>
                <li>Select your workspace and authorize Orbit</li>
                <li>You'll be redirected back with Jira connected</li>
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
            style={{ backgroundColor: jiraColor, color: "white" }}
          >
            Connect Jira
          </Button>
        )}

        {isConnected && (
          <>
            <Button
              onClick={onConnect}
              loading={loading}
              className="w-full cursor-pointer"
              style={{ backgroundColor: jiraColor, color: "white" }}
            >
              Reauthorize Jira
            </Button>
            <Button
              variant="outline"
              onClick={onDisconnect}
              loading={loading}
              className="w-full cursor-pointer"
              style={{
                borderColor: jiraColorBorder,
                color: jiraColor,
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
