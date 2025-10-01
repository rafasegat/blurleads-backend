import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit(): Promise<void> {
    console.log('🔌 Connecting to database...');
    await this.$connect();
    console.log('✅ Database connected successfully');
  }

  async onModuleDestroy(): Promise<void> {
    console.log('🔌 Disconnecting from database...');
    await this.$disconnect();
    console.log('✅ Database disconnected');
  }
}
