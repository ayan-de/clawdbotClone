import {
  IsEmail,
  IsOptional,
  IsString,
  IsBoolean,
  MaxLength,
  MinLength,
  IsEnum,
  IsNumber,
} from 'class-validator';

/**
 * Update User DTO
 * Validation DTO for updating user profile
 * All fields are optional for partial updates
 */
export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: 'Must be a valid email address' })
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  picture?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // Telegram Integration
  @IsOptional()
  telegramUsername?: string | null;

  @IsOptional()
  telegramId?: number | null;

  // AI Provider Settings
  @IsOptional()
  @IsEnum(['openai', 'claude', 'ollama'], { message: 'Must be one of: openai, claude, ollama' })
  selectedAiProvider?: 'openai' | 'claude' | 'ollama';

  @IsOptional()
  @IsString()
  openaiApiKey?: string;

  @IsOptional()
  @IsString()
  claudeApiKey?: string;

  // Email Integration
  @IsOptional()
  @IsEmail({}, { message: 'Must be a valid email address' })
  @MaxLength(255)
  emailAddress?: string | null;
}
