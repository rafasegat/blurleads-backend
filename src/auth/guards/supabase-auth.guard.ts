import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No valid authorization header found');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const user = await this.supabaseService.getUser(token);
      request.user = user;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid authentication token');
    }
  }
}

