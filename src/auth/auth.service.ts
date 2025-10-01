import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { SupabaseService } from '../common/supabase/supabase.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseService: SupabaseService
  ) {}

  async register(registerData: {
    email: string;
    password: string;
    name?: string;
    company?: string;
  }): Promise<{ user: any; session: any }> {
    console.log('🔐 Registering new user:', registerData.email);

    const { email, password, name, company } = registerData;

    // Sign up with Supabase
    const { user, session } = await this.supabaseService.signUp(
      email,
      password,
      {
        name,
        company,
      }
    );

    if (!user || !session) {
      throw new UnauthorizedException('Failed to create user account');
    }

    // Create user profile in our database
    const userProfile = await this.prisma.user.create({
      data: {
        id: user.id,
        email: user.email!,
        name,
        company,
      },
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        createdAt: true,
      },
    });

    console.log('✅ User registered successfully:', userProfile.email);

    return { user: userProfile, session };
  }

  async login(loginData: {
    email: string;
    password: string;
  }): Promise<{ user: any; session: any }> {
    console.log('🔐 Attempting login for:', loginData.email);

    const { email, password } = loginData;

    // Sign in with Supabase
    const { user, session } = await this.supabaseService.signIn(
      email,
      password
    );

    if (!user || !session) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get user profile from our database
    const userProfile = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        createdAt: true,
      },
    });

    if (!userProfile) {
      throw new UnauthorizedException('User profile not found');
    }

    console.log('✅ User logged in successfully:', userProfile.email);

    return {
      user: userProfile,
      session,
    };
  }

  async validateUser(authToken: string): Promise<any> {
    console.log('🔍 Validating user with Supabase');

    const user = await this.supabaseService.getUser(authToken);

    if (!user) {
      throw new UnauthorizedException('Invalid authentication token');
    }

    // Get user profile from our database
    const userProfile = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        createdAt: true,
      },
    });

    if (!userProfile) {
      throw new UnauthorizedException('User profile not found');
    }

    return userProfile;
  }
}
