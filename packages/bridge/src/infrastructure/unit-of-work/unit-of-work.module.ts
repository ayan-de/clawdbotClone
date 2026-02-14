import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseConfig } from '../database';
import { ConfigService } from '@nestjs/config';
import { UnitOfWork } from './unit-of-work.service';
import { IUnitOfWork } from './unit-of-work.interface';

/**
 * Unit of Work Module
 * Provides transaction management throughout the application
 * @Global() makes it available to all modules without importing
 *
 * Follows SOLID - Dependency Inversion: Other modules depend on IUnitOfWork
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        DatabaseConfig.getOrmOptions(configService),
    }),
  ],
  providers: [
    {
      provide: IUnitOfWork,
      useClass: UnitOfWork,
    },
    UnitOfWork,
  ],
  exports: [UnitOfWork, TypeOrmModule],
})
export class UnitOfWorkModule {}
