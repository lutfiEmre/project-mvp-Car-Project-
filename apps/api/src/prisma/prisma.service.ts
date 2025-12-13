import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Connection pooling configuration for production
    // Optimized: Increased pool size from 20 to 50 for better scalability
    const databaseUrl = process.env.DATABASE_URL;
    const connectionLimit = process.env.DATABASE_CONNECTION_LIMIT || '50';
    const poolTimeout = process.env.DATABASE_POOL_TIMEOUT || '20';
    
    // Add connection pooling parameters if not already present
    const dbUrl = databaseUrl?.includes('?') 
      ? `${databaseUrl}&connection_limit=${connectionLimit}&pool_timeout=${poolTimeout}`
      : `${databaseUrl}?connection_limit=${connectionLimit}&pool_timeout=${poolTimeout}`;

    super({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }

    const models = Reflect.ownKeys(this).filter((key) => {
      return (
        typeof key === 'string' &&
        !key.startsWith('_') &&
        !key.startsWith('$') &&
        typeof (this as any)[key]?.deleteMany === 'function'
      );
    });

    return Promise.all(models.map((model) => (this as any)[model].deleteMany()));
  }
}

