import {
    Controller,
    Post,
    Body,
    Param,
    NotFoundException,
    Logger,
    HttpCode,
} from '@nestjs/common';
import { IAdapterFactoryService } from '../../application/adapters/interfaces/adapter-factory.interface';

/**
 * Webhooks Controller
 * Handles incoming webhooks from chat platforms
 */
@Controller('webhooks')
export class WebhooksController {
    private readonly logger = new Logger(WebhooksController.name);

    constructor(private readonly adapterFactory: IAdapterFactoryService) { }

    /**
     * Handle platform webhook
     * Endpoint: POST /webhooks/:platform
     */
    @Post(':platform')
    @HttpCode(200)
    async handleWebhook(
        @Param('platform') platform: string,
        @Body() body: any,
    ): Promise<any> {
        this.logger.debug(`Received webhook for ${platform}`);

        try {
            const adapter = this.adapterFactory.getAdapter(platform);

            if (!adapter) {
                throw new NotFoundException(`Adapter for ${platform} not found`);
            }

            await adapter.processUpdate(body);

            return { status: 'ok' };
        } catch (error: any) {
            this.logger.error(
                `Failed to process webhook for ${platform}: ${error.message}`,
            );
            throw error;
        }
    }
}
