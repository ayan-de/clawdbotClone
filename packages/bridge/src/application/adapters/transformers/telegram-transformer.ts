import { BaseTransformer } from './base-transformer';

/**
 * Telegram Message Transformer
 * Handles Telegram-specific message formatting
 * Telegram supports Markdown v2 and HTML formatting
 */
export class TelegramTransformer extends BaseTransformer {
    getPlatform(): string {
        return 'telegram';
    }

    /**
     * Format message for Telegram Markdown v2
     * Escapes special characters: _ * [ ] ( ) ~ ` > # + - = | { } . !
     */
    protected formatMarkdown(message: string): string {
        // Escape Markdown v2 special characters
        const escapeRegex = /[_*[\]()~`>#+\-=|{}.!\\]/g;
        return message.replace(escapeRegex, '\\$&');
    }

    /**
     * Format message for Telegram HTML
     * Converts common markdown to HTML
     */
    protected formatHtml(message: string): string {
        let html = message;

        // Convert bold: **text** -> <b>text</b>
        html = html.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');

        // Convert italic: *text* -> <i>text</i>
        html = html.replace(/\*([^*]+)\*/g, '<i>$1</i>');

        // Convert code: `text` -> <code>text</code>
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Convert code block: ```text``` -> <pre>text</pre>
        html = html.replace(/```([\s\S]*?)```/g, '<pre>$1</pre>');

        // Convert links: [text](url) -> <a href="url">text</a>
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

        return html;
    }
}
