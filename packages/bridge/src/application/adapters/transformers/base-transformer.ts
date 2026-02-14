import { MessageTransformer } from '../message-transformer.interface';

/**
 * Base Message Transformer
 * Provides default formatting behavior
 * Can be extended by platform-specific transformers
 */
export abstract class BaseTransformer implements MessageTransformer {
    abstract getPlatform(): string;

    /**
     * Default transform - just returns the message as-is
     */
    transform(message: string, options?: { format?: 'plain' | 'markdown' | 'html' }): string {
        if (options?.format === 'markdown') {
            return this.formatMarkdown(message);
        }
        if (options?.format === 'html') {
            return this.formatHtml(message);
        }
        return message;
    }

    /**
     * Format as Markdown - can be overridden by subclasses
     */
    protected formatMarkdown(message: string): string {
        return message;
    }

    /**
     * Format as HTML - can be overridden by subclasses
     */
    protected formatHtml(message: string): string {
        return message;
    }
}
