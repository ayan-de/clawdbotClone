import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BridgeLogger } from '../../logger';
import { ConfigModule } from '../../config';
import { TelegramAdapter } from './telegram.adapter';
import { AdapterFactoryService } from './adapter-factory.service';
import { MessageRouterService } from './message-router.service';
import { WebhooksController } from '../../presentation/controllers/webhooks.controller';
import { IAdapterFactoryService } from './interfaces/adapter-factory.interface';
import { IMessageRouterService } from './interfaces/message-router.interface';
import { SessionModule } from '../session/session.module';
import { UsersModule } from '../users/users.module';

/**
 * Adapters Module
 * Provides chat platform adapter management
 * Follows SOLID - Single Responsibility: Only handles adapters
 */
@Module({
  imports: [ConfigModule, EventEmitterModule.forRoot(), SessionModule, UsersModule],
  controllers: [WebhooksController],
  providers: [
    BridgeLogger,
    TelegramAdapter,
    {
      provide: IAdapterFactoryService,
      useClass: AdapterFactoryService,
    },
    {
      provide: IMessageRouterService,
      useClass: MessageRouterService,
    },
  ],
  exports: [
    IAdapterFactoryService,
    IMessageRouterService,
    TelegramAdapter,
  ],
})
export class AdaptersModule { }
