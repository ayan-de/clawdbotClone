import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BridgeLogger } from '../../logger';
import { ConfigModule } from '../../config';
import { TelegramAdapter } from './telegram.adapter';
import { AdapterFactoryService } from './adapter-factory.service';
import { MessageRouterService } from './message-router.service';
import { WebhooksController } from '../../presentation/controllers/webhooks.controller';

/**
 * Adapters Module
 * Provides chat platform adapter management
 * Follows SOLID - Single Responsibility: Only handles adapters
 */
@Module({
  imports: [ConfigModule, EventEmitterModule.forRoot()],
  controllers: [WebhooksController],
  providers: [
    BridgeLogger,
    TelegramAdapter,
    AdapterFactoryService,
    MessageRouterService,
  ],
  exports: [
    AdapterFactoryService,
    MessageRouterService,
    TelegramAdapter,
  ],
})
export class AdaptersModule { }
