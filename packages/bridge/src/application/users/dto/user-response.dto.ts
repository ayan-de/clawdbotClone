/**
 * User Response DTO
 * Standardized user response object
 */
export class UserResponseDto {
  id!: string;

  email!: string;

  firstName?: string;

  lastName?: string;

  displayName?: string;

  picture?: string;

  isActive!: boolean;

  createdAt!: Date;

  updatedAt!: Date;

  lastLoginAt?: Date;

  // Telegram Integration
  telegramUsername?: string;

  telegramId?: number;

  // AI Provider Settings
  selectedAiProvider?: 'openai' | 'claude' | 'ollama';
}
