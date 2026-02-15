import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DesktopTokensService } from './desktop-tokens.service';
import { CreateDesktopTokenDto } from '../domain/dto/create-desktop-token.dto';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../../common/decorators';
import { User } from '../domain/entities';
import { Throttle } from '@nestjs/throttler';

/**
 * Desktop Connection Tokens Controller
 * Handles desktop connection token generation and management
 * All routes require authentication
 */
@Controller('desktop/tokens')
@UseGuards(JwtAuthGuard)
export class DesktopTokensController {
  constructor(private readonly desktopTokensService: DesktopTokensService) {}

  /**
   * Generate a new desktop connection token
   * Rate limited to prevent token abuse
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 3, ttl: 60 } }) // 3 requests per minute
  async generateToken(
    @CurrentUser() user: User,
    @Body() dto?: CreateDesktopTokenDto,
  ) {
    return this.desktopTokensService.generateToken(user.id, dto);
  }

  /**
   * Get all active (unused) connection tokens for current user
   */
  @Get()
  async getActiveTokens(@CurrentUser() user: User) {
    return this.desktopTokensService.getActiveTokens(user.id);
  }

  /**
   * Revoke all tokens for current user
   * Useful for security (e.g., lost device)
   */
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeAllTokens(@CurrentUser() user: User): Promise<void> {
    await this.desktopTokensService.revokeAllTokens(user.id);
  }
}
