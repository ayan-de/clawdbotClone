import { IsString, IsArray, IsOptional, IsInt, IsObject, Min, IsBoolean } from 'class-validator';

/**
 * DTO for command execution request
 *
 * Expected from Python Agent (orbit-agent)
 */
export class ExecuteCommandDto {
  @IsString()
  command!: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  args?: string[];

  @IsString()
  @IsOptional()
  cwd?: string;

  @IsObject()
  @IsOptional()
  env?: Record<string, string>;

  @IsInt()
  @Min(1000)
  @IsOptional()
  timeout?: number;

  @IsBoolean()
  @IsOptional()
  trusted?: boolean;  // Skip injection check for internal tools
}

/**
 * DTO for command execution response
 *
 * Returned to Python Agent (orbit-agent)
 */
export class CommandResponseDto {
  command!: string;
  stdout!: string;
  stderr!: string;
  exit_code!: number;
  duration_ms!: number;
  success!: boolean;
}
