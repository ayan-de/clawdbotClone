"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../ui/card";
import { Button } from "../ui/button";

/**
 * Jira Integration Card Component
 *
 * Handles Jira OAuth 1.0a connection flow
 * Connects via Bridge API (/auth/jira/store-tokens, /auth/jira/status, /auth/jira/disconnect)
 */
export interface JiraCardProps {
  isConnected: boolean;
  username?: string;
  workspaceUrl?: string;
  base_url?: string;
  onConnect: () => void;
  onDisconnect: () => void;
  loading?: boolean;
}

export function JiraCard({
  isConnected,
  username,
  workspaceUrl,
  base_url,
  onConnect,
  onDisconnect,
  loading = false,
}: JiraCardProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  // For OAuth flow: redirect to authorize endpoint
  const handleConnect = () => {
    setIsConnecting(true);
    const params = new URLSearchParams();
    params.append('user_id', 'current_user_id'); // Would use actual user ID

    // Redirect to Jira authorize endpoint
    window.location.href = `/auth/jira/authorize?${params.toString()}`;
  };

  const handleDisconnect = async () => {
    try {
      // Call Bridge disconnect endpoint
      const params = new URLSearchParams();
      params.append('user_id', 'current_user_id'); // Would use actual user ID

      const response = await fetch(
        `/auth/jira/disconnect?${params.toString()}`,
        { redirect: 'follow' }
      );

      const result = await response.json();
      if (result.success) {
        onDisconnect();
      } else {
        alert(result.message || 'Failed to disconnect Jira');
      }
    } catch (error) {
      console.error('Jira disconnect error:', error);
      alert('Failed to disconnect Jira. Please check console.');
    }
  };

  const jiraColor = "#0052cc";
  const jiraColorLight = "rgba(0, 82, 204, 0.1)";
  const jiraColorBorder = "rgba(0, 82, 204, 0.3)";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Jira Integration</CardTitle>
        {isConnected && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse"></span>
          </div>
        )}
        {!isConnected && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234, 179, 8, 0.5)]"></span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {!isConnected && (
          <>
            {/* Description */}
            <div className="border p-4 rounded bg-white/10 mb-4">
              <p className="text-xs text-white/60 leading-relaxed">
                Connect your Jira workspace to manage issues, update tickets, and track progress
                through Orbit AI.
              </p>

              <div className="space-y-2 text-[10px] text-white/80">
                <p>
                  <strong className="text-white cursor-blink">❯</strong>{" "}
                  <strong className="text-white">Step 1:</strong> Create Jira OAuth app in{" "}
                  <a
                    href="https://developer.atlassian.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 underline hover:text-blue-300"
                  >
                    Atlassian Developer Portal
                  </a>
                </p>
                <p>
                  <strong className="text-white cursor-blink">❯</strong>{" "}
                  <strong className="text-white">Step 2:</strong> Copy Client ID and Client Secret
                </p>
                <p>
                  <strong className="text-white cursor-blink">❯</strong>{" "}
                  <strong className="text-white">Step 3:</strong> Enter credentials below and click "Connect"
                </p>
              </div>
            </div>

            {/* Connect Form */}
            <div className="border p-4 rounded bg-white/10">
              <p className="text-sm text-white mb-3">Enter your Jira OAuth credentials:</p>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Atlassian Domain (Base URL)
                  </label>
                  <input
                    type="text"
                    placeholder="https://your-domain.atlassian.net"
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500/20 bg-white/5"
                    id="jira-base-url"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Client ID (from Atlassian)
                  </label>
                  <input
                    type="text"
                    placeholder="1234567890abcdef..."
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500/20 bg-white/5"
                    id="jira-client-id"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Client Secret (from Atlassian)
                  </label>
                  <input
                    type="password"
                    placeholder="Your client secret"
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500/20 bg-white/5"
                    id="jira-client-secret"
                  />
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-500/10 rounded border border-blue-500/30">
                <p className="text-sm text-blue-200">
                  <strong>💡 Tip:</strong> You can skip this form by adding your Jira credentials to
                  the Bridge <code className="text-blue-300">.env</code> file and restarting the server.
                </p>
              </div>

              <Button
                onClick={handleConnect}
                loading={isConnecting || loading}
                className="w-full cursor-pointer transition-all duration-300 hover:scale-[1.02]"
                style={{ backgroundColor: jiraColor, color: "white" }}
              >
                {isConnecting ? "Connecting..." : "Connect Jira"}
              </Button>
            </div>
          </>
        )}

        {isConnected && (
          <>
            {/* Connected State */}
            <div className="border p-4 relative overflow-hidden">
              <div
                className="relative z-10"
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
                        Connected
                      </p>
                      <p className="text-sm font-bold text-white tracking-tight">
                        {username || 'Jira Workspace'}
                      </p>
                    </div>
                  </div>
                  <div
                    className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                    style={{ backgroundColor: jiraColor }}
                  />
                </div>
              </div>
            </div>

            {/* Usage Examples */}
            <div className="mt-2 p-4 bg-white/5 rounded border border-white/10">
              <p className="text-[10px] text-white/70 mb-1">
                Example usage:
              </p>
              <ul className="space-y-2 text-sm text-white/90">
                <li>
                  <code className="text-white/90 bg-white/10 px-2 py-1 rounded">
                    list my jira tickets
                  </code>
                </li>
                <li>
                  <code className="text-white/90 bg-white/10 px-2 py-1 rounded">
                    show ticket TDX-300
                  </code>
                </li>
                <li>
                  <code className="text-white/90 bg-white/10 px-2 py-1 rounded">
                    mark TDX-300 as done
                  </code>
                </li>
                <li>
                  <code className="text-white/90 bg-white/10 px-2 py-1 rounded">
                    add note to TDX-300: "Fixed in production"
                  </code>
                </li>
                <li>
                  <code className="text-white/90 bg-white/10 px-2 py-1 rounded">
                    create ticket: "New bug in login page"
                  </code>
                </li>
                <li>
                  <code className="text-white/90 bg-white/10 px-2 py-1 rounded">
                    search for: "login" tickets
                  </code>
                </li>
              </ul>
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-3">
        {!isConnected && (
          <Button
            onClick={handleConnect}
            loading={isConnecting || loading}
            className="w-full cursor-pointer transition-all duration-300 hover:scale-[1.02]"
            style={{ backgroundColor: jiraColor, color: "white" }}
          >
            Connect Jira
          </Button>
        )}

        {isConnected && (
          <Button
            variant="outline"
            onClick={handleDisconnect}
            loading={loading}
            className="w-full cursor-pointer transition-all duration-300 hover:scale-[1.02]"
            style={{
              borderColor: jiraColorBorder,
              color: jiraColor,
            }}
          >
            Disconnect
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
