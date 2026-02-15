import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * DTO for creating a Desktop Connection Token
 * Optional desktop name for user identification
 */
export class CreateDesktopTokenDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  desktopName?: string;
}
