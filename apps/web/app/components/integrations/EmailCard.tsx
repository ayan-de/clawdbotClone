"use client";

import { MdEmail } from "react-icons/md";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../ui/card";
import { Button } from "../ui/button";

/**
 * Email Integration Card Component
 * Placeholder for future email integration
 * Demonstrates the scalable pattern for adding new integrations
 */
export function EmailCard() {
  const emailColor = "#EA4335";
  const emailColorLight = "rgba(234, 67, 53, 0.1)";
  const emailColorBorder = "rgba(234, 67, 53, 0.3)";

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-3">
            <MdEmail className="text-lg" style={{ color: emailColor }} />
            <span>Integration::Email</span>
            <div className="flex-1" />
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/30">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: emailColorBorder }}
              />
              Coming Soon
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-xs text-white/60 leading-relaxed">
          Configure email notifications for system events, command executions,
          and alerts.
        </p>

        <div
          className="border p-4"
          style={{
            backgroundColor: emailColorLight,
            borderColor: emailColorBorder,
          }}
        >
          <p className="text-[10px] text-white/40 italic text-center">
            [ Email notifications coming in next release ]
          </p>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          variant="outline"
          className="w-full"
          disabled
          style={{ borderColor: emailColorBorder, color: emailColor }}
        >
          Configure Email
        </Button>
      </CardFooter>
    </Card>
  );
}
