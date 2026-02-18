import { Module, OnModuleInit, Logger, Inject, forwardRef } from '@nestjs/common';
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
import { WebSocketModule } from '../../presentation/websocket/websocket.module';
import { ExecutionModule } from '../execution/execution.module';

/**
 * Adapters Module
 * Provides chat platform adapter management
 * Auto-initializes Telegram adapter on startup
 */
@Module({
  imports: [
    ConfigModule,
    EventEmitterModule.forRoot(),
    SessionModule,
    UsersModule,
    WebSocketModule,
    forwardRef(() => ExecutionModule),
  ],
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
export class AdaptersModule implements OnModuleInit {
  private readonly logger = new Logger(AdaptersModule.name);

  constructor(
    @Inject(IAdapterFactoryService)
    private readonly adapterFactory: IAdapterFactoryService,
  ) { }

  async onModuleInit() {
    // Auto-initialize Telegram adapter on startup
    try {
      this.adapterFactory.createAdapter('telegram');
      this.logger.log('Telegram adapter auto-initialized on startup');
    } catch (error: any) {
      this.logger.warn(`Telegram adapter initialization skipped: ${error.message}`);
    }
  }
}
