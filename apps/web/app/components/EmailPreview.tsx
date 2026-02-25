"use client";

import { MdEmail } from "react-icons/md";
import { Button } from "./ui/button";

export interface EmailPreviewProps {
  fromEmail: string;
  toEmail: string;
  subject: string;
  body: string;
  attachments?: Array<{
    filename: string;
    mimetype: string;
    size: number;
  }>;
  onSend: () => void;
  onCancel: () => void;
  onModify: (text: string) => void;
  sending?: boolean;
  iteration?: number;
}

/**
 * Email Preview Component
 *
 * Displays email draft preview with send/cancel/modify actions.
 * Used for human-in-the-loop confirmation in email workflow.
 */
export function EmailPreview({
  fromEmail,
  toEmail,
  subject,
  body,
  attachments = [],
  onSend,
  onCancel,
  onModify,
  sending = false,
  iteration = 0,
}: EmailPreviewProps) {
  return (
    <div className="my-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center flex-shrink-0">
          <MdEmail className="text-red-600 dark:text-red-400" size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                From:
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {fromEmail}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                To:
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {toEmail}
              </span>
            </div>
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {subject}
            </div>
          </div>
        </div>
        {iteration > 0 && (
          <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded text-xs text-blue-600 dark:text-blue-400">
            <span className="font-medium">Refinement #{iteration}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="mb-4">
        <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
          {body}
        </div>
      </div>

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            Attachments ({attachments.length}):
          </p>
          <div className="space-y-1">
            {attachments.map((att, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 0l-6.414-6.586a2 2 0 01-2.828 0L6.172 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2v-2a2 2 0 01-.586-1.414l-6.414-6.414a2 2 0 00-2.828 0l6.586 6.586a2 2 0 012.828 0l6.414 6.414a2 2 0 01.586-1.414L16.172 19H18a2 2 0 002-2v-8a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 01-.586-1.414z" />
                </svg>
                <span className="truncate max-w-[200px]" title={att.filename}>
                  {att.filename}
                </span>
                <span className="text-gray-500 dark:text-gray-500">
                  ({(att.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          onClick={onSend}
          loading={sending}
          className="flex-1"
          style={{ backgroundColor: "#EA4335", color: "white" }}
        >
          {sending ? "Sending..." : "Send Email"}
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={sending}
          className="flex-1"
          style={{ borderColor: "#d1d5db", color: "#d1d5db" }}
        >
          Cancel
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-xs text-blue-700 dark:text-blue-400 mb-2">
          <strong>Quick actions:</strong>
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Button
            variant="ghost"
            onClick={() => onModify("Make it shorter")}
            className="h-8 text-left"
            disabled={sending}
          >
            Make it shorter
          </Button>
          <Button
            variant="ghost"
            onClick={() => onModify("Make it more formal")}
            className="h-8 text-left"
            disabled={sending}
          >
            Make it more formal
          </Button>
          <Button
            variant="ghost"
            onClick={() => onModify("Add more details")}
            className="h-8 text-left"
            disabled={sending}
          >
            Add more details
          </Button>
          <Button
            variant="ghost"
            onClick={() => onModify("Change tone to friendly")}
            className="h-8 text-left"
            disabled={sending}
          >
            Change tone
          </Button>
        </div>
      </div>
    </div>
  );
}
