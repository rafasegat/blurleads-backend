import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No valid authorization header found');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      // Get Supabase user from token
      const supabaseUser = await this.supabaseService.getUser(token);

      if (!supabaseUser) {
        throw new UnauthorizedException('Invalid authentication token');
      }

      // Get user profile from our database
      let userProfile = await this.prisma.user.findUnique({
        where: { id: supabaseUser.id },
        select: {
          id: true,
          email: true,
          name: true,
          company: true,
          createdAt: true,
        },
      });

      // If user profile doesn't exist, create it
      if (!userProfile) {
        console.log(
          '👤 Creating user profile for Supabase user:',
          supabaseUser.id
        );
        userProfile = await this.prisma.user.create({
          data: {
            id: supabaseUser.id,
            email: supabaseUser.email!,
            name:
              supabaseUser.user_metadata?.name ||
              supabaseUser.user_metadata?.full_name,
            company: supabaseUser.user_metadata?.company,
          },
          select: {
            id: true,
            email: true,
            name: true,
            company: true,
            createdAt: true,
          },
        });
        console.log('✅ User profile created:', userProfile.email);
      }

      request.user = userProfile;
      return true;
    } catch (error) {
      console.error('SupabaseAuthGuard error:', error);
      throw new UnauthorizedException('Invalid authentication token');
    }
  }
}
