import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Gateway Auth Decorator
 * Extracts the authenticated user from WebSocket gateway context
 *
 * @example
 * @SubscribeMessage('message')
 * handleMessage(@GatewayAuth() user: any, @MessageBody() data: any) {
 *   console.log('Message from:', user.email);
 * }
 */
export const GatewayAuth = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): any => {
    const socket = ctx.switchToWs().getClient();
    return (socket as any).user;
  },
);
