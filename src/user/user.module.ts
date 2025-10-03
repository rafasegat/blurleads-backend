import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from '../common/prisma/prisma.service';
import { SupabaseService } from '../common/supabase/supabase.service';

@Module({
  providers: [UserService, PrismaService, SupabaseService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
