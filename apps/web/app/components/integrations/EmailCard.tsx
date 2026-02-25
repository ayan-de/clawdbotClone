"use client";

import { MdEmail } from "react-icons/md";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../ui/card";
import { Button } from "../ui/button";

export interface EmailCardProps {
  isConnected: boolean;
  emailAddress?: string;
  onConnect: () => void;
  onDisconnect: () => void;
  loading?: boolean;
}

/**
 * Gmail Integration Card Component
 * Displays connection status and actions for Gmail integration
 */
export function EmailCard({
  isConnected,
  emailAddress,
  onConnect,
  onDisconnect,
  loading = false,
}: EmailCardProps) {
  const gmailColor = "#EA4335";
  const gmailColorLight = "rgba(234, 67, 53, 0.1)";
  const gmailColorBorder = "rgba(234, 67, 53, 0.3)";
  const gmailColorGlow = "rgba(234, 67, 53, 0.5)";

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-3">
            <MdEmail className="text-lg" style={{ color: gmailColor }} />
            <span>Integration::Email</span>
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
          Connect your Gmail account to send emails through natural language
          commands using Orbit AI.
        </p>

        {/* Connection Details */}
        {isConnected && emailAddress && (
          <div
            className="border p-4 relative"
            style={{
              backgroundColor: gmailColorLight,
              borderColor: gmailColorBorder,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MdEmail style={{ color: gmailColor }} />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">
                    Linked Account
                  </p>
                  <p className="text-sm font-bold text-white tracking-tight">
                    {emailAddress}
                  </p>
                </div>
              </div>
            </div>
            <div
              className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: gmailColor }}
            />
          </div>
        )}

        {!isConnected && (
          <div className="border border-white/20 p-4 bg-white/5">
            <div className="space-y-2 text-[10px] text-white/80">
              <p>
                <strong className="text-white">How to connect Gmail:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1 mt-2 ml-2">
                <li>Click the "Connect" button below</li>
                <li>You'll be redirected to Google OAuth</li>
                <li>Authorize Orbit to send emails</li>
                <li>You'll be redirected back with Gmail connected</li>
              </ol>
            </div>
          </div>
        )}

        {/* Example Usage */}
        {isConnected && (
          <div className="mt-2 p-3 bg-white/5 rounded border border-white/10">
            <p className="text-[10px] text-white/70 mb-1">
              Example usage:
            </p>
            <code className="text-sm text-white/90 block">
              "email 'Happy birthday' to friend@gmail.com"
            </code>
            <p className="text-[10px] text-white/60 mt-2">
              Or with file attachments: "email 'Here is the report' to boss@company.com with this file"
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-3">
        {!isConnected && (
          <Button
            onClick={onConnect}
            loading={loading}
            className="w-full"
            style={{ backgroundColor: gmailColor, color: "white" }}
          >
            Connect Gmail
          </Button>
        )}

        {isConnected && (
          <>
            <Button
              onClick={onConnect}
              loading={loading}
              className="w-full"
              style={{ backgroundColor: gmailColor, color: "white" }}
            >
              Reauthorize Gmail
            </Button>
            <Button
              variant="outline"
              onClick={onDisconnect}
              loading={loading}
              className="w-full"
              style={{
                borderColor: gmailColorBorder,
                color: gmailColor,
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
