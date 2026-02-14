/**
 * User Response DTO
 * Standardized user response object
 */
export class UserResponseDto {
  id!: string;

  email!: string;

  firstName?: string;

  lastName?: string;

  displayName?: string;

  picture?: string;

  isActive!: boolean;

  createdAt!: Date;

  updatedAt!: Date;

  lastLoginAt?: Date;
}
