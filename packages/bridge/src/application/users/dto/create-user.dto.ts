import { IsEmail, IsOptional, IsString, IsBoolean, MaxLength, MinLength } from 'class-validator';

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
}
