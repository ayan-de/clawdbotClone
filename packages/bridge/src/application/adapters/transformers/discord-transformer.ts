import { BaseTransformer } from './base-transformer';

/**
 * Discord Message Transformer
 * Handles Discord-specific message formatting
 * Discord supports a subset of Markdown
 */
export class DiscordTransformer extends BaseTransformer {
    getPlatform(): string {
        return 'discord';
    }

    /**
     * Format message for Discord Markdown
     * Discord supports: bold, italic, underline, strikethrough, code blocks, and links
     */
    protected formatMarkdown(message: string): string {
        // Discord Markdown doesn't require escaping most characters
        // Just ensure proper formatting
        return message;
    }

    /**
     * Format message for Discord with HTML-like tags converted to Discord syntax
     */
    protected formatHtml(message: string): string {
        let formatted = message;

        // Convert <b> to **
        formatted = formatted.replace(/<b>([^<]+)<\/b>/g, '**$1**');

        // Convert <i> to *
        formatted = formatted.replace(/<i>([^<]+)<\/i>/g, '*$1*');

        // Convert <u> to __
        formatted = formatted.replace(/<u>([^<]+)<\/u>/g, '__$1__');

        // Convert <s> to ~~
        formatted = formatted.replace(/<s>([^<]+)<\/s>/g, '~~$1~~');

        // Convert <code> to `
        formatted = formatted.replace(/<code>([^<]+)<\/code>/g, '`$1`');

        // Convert <pre> to ```
        formatted = formatted.replace(/<pre>([\s\S]*?)<\/pre>/g, '```$1```');

        return formatted;
    }
}
