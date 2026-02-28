import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { CommandsService } from '../services/commands.service';
import { ExecuteCommandDto, CommandResponseDto } from '../dto/execute-command.dto';

/**
 * Commands Controller
 *
 * REST API endpoints for executing shell commands.
 *
 * ARCHITECTURE OWNERSHIP:
 * - Bridge (this controller): SINGLE authoritative entry point for all command execution
 * - Python Agent: Only for NLP translation and planning - MUST NOT execute directly
 * - Desktop TUI: Actual shell execution (only this component)
 *
 * SINGLE AUTHORITY RULE:
 * All shell command execution MUST flow through this controller.
 * No component except the Desktop TUI should execute shell commands directly.
 *
 * Supported Use Cases:
 * 1. Agent workflows (multi-step): Agent returns commands to Bridge, Bridge executes
 * 2. External API calls: Direct HTTP POST to this endpoint
 * 3. Internal Bridge operations: Via CommandsService.executeCommand
 *
 * Flow:
 * 1. Request received (from Agent or external caller)
 * 2. Bridge routes command to connected Desktop TUI via WebSocket
 * 3. Desktop executes command and sends back result
 * 4. Bridge returns result to caller
 */
@Controller('api/v1/commands')
export class CommandsController {
  constructor(private readonly commandsService: CommandsService) {}

  /**
   * Execute a shell command
   *
   * This endpoint is called by the Python AI Agent to execute commands.
   * The command is routed to a connected Desktop TUI client via WebSocket.
   *
   * @param dto Command execution request
   * @returns Command execution result
   */
  @Public()
  @Post('execute')
  async execute(@Body() dto: ExecuteCommandDto): Promise<CommandResponseDto> {
    try {
      // Build full command string
      const command = this.commandsService.buildCommandString(dto.command, dto.args);

      // Execute command via Desktop Gateway
      const result = await this.commandsService.executeCommand({
        command,
        cwd: dto.cwd,
        timeout: dto.timeout || 30000,
        trusted: dto.trusted || false,
      });

      return result;
    } catch (error: any) {
      // Handle specific error cases
      if (error.message?.includes('No desktop connected')) {
        throw new HttpException(
          {
            message: 'No desktop client connected',
            code: 'NO_DESKTOP_CONNECTED',
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      if (error.message?.includes('No session available')) {
        throw new HttpException(
          {
            message: 'No active session for command execution',
            code: 'NO_SESSION_AVAILABLE',
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      // Generic error
      throw new HttpException(
        {
          message: error.message || 'Command execution failed',
          code: 'EXECUTION_ERROR',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
