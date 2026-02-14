import { BaseTransformer } from './base-transformer';

/**
 * Slack Message Transformer
 * Handles Slack-specific message formatting
 * Slack uses mrkdown (Markdown-like) format
 */
export class SlackTransformer extends BaseTransformer {
    getPlatform(): string {
        return 'slack';
    }

    /**
     * Format message for Slack mrkdown
     * Slack supports: bold, italic, strikethrough, code blocks, and links
     */
    protected formatMarkdown(message: string): string {
        // Slack mrkdwn formatting
        // *bold* -> *bold*
        // _italic_ -> _italic_
        // ~strikethrough~ -> ~strikethrough~
        // `code` -> `code`
        // ```code block``` -> ```code block```
        // [link text](url) -> <url|link text>
        return this.convertMarkdownLinksToSlack(message);
    }

    /**
     * Format message for Slack (no HTML support)
     */
    protected formatHtml(message: string): string {
        // Strip HTML tags and convert to mrkdwn
        let formatted = message;

        // Convert <b> to *
        formatted = formatted.replace(/<b>([^<]+)<\/b>/g, '*$1*');

        // Convert <i> to _
        formatted = formatted.replace(/<i>([^<]+)<\/i>/g, '_$1_');

        // Convert <s> to ~
        formatted = formatted.replace(/<s>([^<]+)<\/s>/g, '~$1~');

        // Convert <code> to `
        formatted = formatted.replace(/<code>([^<]+)<\/code>/g, '`$1`');

        // Convert <pre> to ```
        formatted = formatted.replace(/<pre>([\s\S]*?)<\/pre>/g, '```$1```');

        return formatted;
    }

    /**
     * Convert Markdown links to Slack format
     * [text](url) -> <url|text>
     */
    private convertMarkdownLinksToSlack(message: string): string {
        return message.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<$2|$1>');
    }
}
