import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { User } from '../domain/entities';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../../common/decorators';
import { Throttle } from '@nestjs/throttler';

/**
 * Users Controller
 * Handles user CRUD operations
 * All routes require authentication except where @Public() is used
 */
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get current user profile
   */
  @Get('me')
  async getCurrentUser(@CurrentUser() user: User): Promise<UserResponseDto> {
    return this.usersService.findById(user.id);
  }

  /**
   * Get user by ID
   */
  @Get(':id')
  async findById(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.findById(id);
  }

  /**
   * Get all users with pagination
   */
  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ): Promise<{ users: UserResponseDto[]; total: number }> {
    return this.usersService.findAll(
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 10,
    );
  }

  /**
   * Create a new user
   * Note: In most cases, users are created via OAuth
   * This endpoint is for admin use or manual user creation
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  /**
   * Update current user profile
   * Rate limited to prevent abuse
   */
  @Put('me')
  @Throttle({ default: { limit: 5, ttl: 60 } }) // 5 requests per minute
  async updateCurrentUser(
    @CurrentUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(user.id, updateUserDto);
  }

  /**
   * Update user by ID
   * Requires admin privileges (to be implemented)
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto);
  }

  /**
   * Deactivate current user (soft delete)
   */
  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCurrentUser(@CurrentUser() user: User): Promise<void> {
    await this.usersService.delete(user.id);
  }

  /**
   * Delete user by ID (hard delete)
   * Requires admin privileges (to be implemented)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.usersService.hardDelete(id);
  }
}
