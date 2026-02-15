import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { JwtPayload } from '../jwt/jwt-payload.interface';
import { User } from '../../domain/entities';

/**
 * JWT Strategy
 * Validates JWT tokens and attaches user to request
 * Used by JwtAuthGuard to protect routes
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'secret'),
    });
    console.log('JwtStrategy initialized');
  }

  /**
   * Validate JWT payload
   * Called for every protected route
   * Returns user which is attached to request object
   */
  async validate(payload: JwtPayload): Promise<User> {
    console.log('JwtStrategy.validate called with payload:', payload);
    const userRepo = this.dataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: payload.sub } });
    console.log('JwtStrategy found user:', user ? user.id : 'null');

    if (!user) {
      console.warn('JwtStrategy: User not found for id:', payload.sub);
      throw new UnauthorizedException('Invalid token: user not found');
    }

    if (!user.isActive) {
      console.warn('JwtStrategy: User is inactive:', user.id);
      throw new UnauthorizedException('User account is inactive');
    }

    return user;
  }
}
