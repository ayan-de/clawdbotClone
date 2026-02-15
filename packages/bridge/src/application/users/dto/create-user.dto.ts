import { IsEmail, IsOptional, IsString, IsBoolean, MaxLength, MinLength, IsEnum, IsNumber } from 'class-validator';

/**
 * Create User DTO
 * Validation DTO for creating a new user
 */
export class CreateUserDto {
  @IsEmail({}, { message: 'Must be a valid email address' })
  @MaxLength(255)
  email!: string;

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

  // Telegram Integration
  @IsOptional()
  @IsString()
  @MaxLength(255)
  telegramUsername?: string;

  @IsOptional()
  @IsNumber()
  telegramId?: number;

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
}
