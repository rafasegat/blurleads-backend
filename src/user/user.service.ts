import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { SupabaseService } from '../common/supabase/supabase.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseService: SupabaseService
  ) {}

  /**
   * Get user by ID with full profile information
   * @param userId - The user ID to fetch
   * @returns User profile with related data
   */
  async getUser(userId: string) {
    console.log('🔍 Fetching user profile for ID:', userId);

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          company: true,
          createdAt: true,
          updatedAt: true,
          clients: {
            select: {
              id: true,
              name: true,
              website: true,
              isActive: true,
              createdAt: true,
            },
          },
          leads: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              company: true,
              status: true,
              createdAt: true,
            },
            take: 10, // Limit to recent leads
            orderBy: { createdAt: 'desc' },
          },
          integrations: {
            select: {
              id: true,
              type: true,
              name: true,
              isActive: true,
              createdAt: true,
            },
          },
          notifications: {
            select: {
              id: true,
              type: true,
              title: true,
              message: true,
              isRead: true,
              createdAt: true,
            },
            take: 5, // Limit to recent notifications
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!user) {
        console.log('❌ User not found:', userId);
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      console.log('✅ User profile fetched successfully:', user.email);
      return user;
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * Get user by email
   * @param email - The user email to fetch
   * @returns User profile
   */
  async getUserByEmail(email: string) {
    console.log('🔍 Fetching user by email:', email);

    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          company: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        console.log('❌ User not found with email:', email);
        throw new NotFoundException(`User with email ${email} not found`);
      }

      console.log('✅ User found by email:', user.email);
      return user;
    } catch (error) {
      console.error('❌ Error fetching user by email:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   * @param userId - The user ID to update
   * @param updateData - The data to update
   * @returns Updated user profile
   */
  async updateUser(
    userId: string,
    updateData: {
      name?: string;
      company?: string;
    }
  ) {
    console.log('📝 Updating user profile for ID:', userId);

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          company: true,
          updatedAt: true,
        },
      });

      console.log('✅ User profile updated successfully:', updatedUser.email);
      return updatedUser;
    } catch (error) {
      console.error('❌ Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Delete user and all related data
   * @param userId - The user ID to delete
   */
  async deleteUser(userId: string) {
    console.log('🗑️ Deleting user and all related data for ID:', userId);

    try {
      // Delete user (cascade will handle related data)
      await this.prisma.user.delete({
        where: { id: userId },
      });

      console.log('✅ User and all related data deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      throw error;
    }
  }
}
