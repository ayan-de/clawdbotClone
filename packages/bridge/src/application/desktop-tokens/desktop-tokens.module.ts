import { Module } from '@nestjs/common';
import { DesktopTokensService } from './desktop-tokens.service';
import { DesktopTokensController } from './desktop-tokens.controller';

/**
 * Desktop Connection Tokens Module
 * Provides functionality for generating and validating desktop connection tokens
 */
@Module({
  controllers: [DesktopTokensController],
  providers: [DesktopTokensService],
  exports: [DesktopTokensService],
})
export class DesktopTokensModule {}
