import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and Anon Key must be provided');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  async getUser(authToken: string) {
    const { data: { user }, error } = await this.supabase.auth.getUser(authToken);

    if (error) {
      throw new Error(`Authentication error: ${error.message}`);
    }

    return user;
  }

  async signUp(email: string, password: string, metadata?: any) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) {
      throw new Error(`Sign up error: ${error.message}`);
    }

    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(`Sign in error: ${error.message}`);
    }

    return data;
  }

  async signOut(authToken: string) {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      throw new Error(`Sign out error: ${error.message}`);
    }
  }

  async resetPassword(email: string) {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email);

    if (error) {
      throw new Error(`Password reset error: ${error.message}`);
    }
  }
}

