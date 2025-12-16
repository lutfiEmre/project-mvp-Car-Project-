import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        // In-memory cache configuration
        // Redis can be added later with cache-manager-redis-store
        return {
          ttl: configService.get<number>('CACHE_TTL', 300), // 5 minutes default
          max: configService.get<number>('CACHE_MAX', 1000), // Maximum number of items
        };
      },
    }),
  ],
  exports: [NestCacheModule],
})
export class CacheModule {}

