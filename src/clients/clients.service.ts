import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a secure API key
   * Format: blk_live_32_random_chars
   */
  private generateApiKey(): string {
    const prefix = 'blk_live_';
    const randomPart = randomBytes(24)
      .toString('base64')
      .replace(/[+/=]/g, '')
      .toLowerCase();
    return prefix + randomPart;
  }

  /**
   * Create a new client for a user with auto-generated API key
   */
  async createClient(
    userId: string,
    data: { name?: string; website?: string }
  ): Promise<any> {
    console.log('🏢 Creating new client for user:', userId);

    // Generate unique API key
    let apiKey: string;
    let isUnique = false;
    let attempts = 0;

    do {
      apiKey = this.generateApiKey();
      const existing = await this.prisma.client.findUnique({
        where: { apiKey },
      });
      isUnique = !existing;
      attempts++;
    } while (!isUnique && attempts < 10);

    if (!isUnique) {
      throw new ConflictException('Unable to generate unique API key');
    }

    // Get user details for default name
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    const clientName =
      data.name ||
      `${user?.name || user?.email?.split('@')[0] || 'User'}'s Website`;

    const client = await this.prisma.client.create({
      data: {
        userId,
        name: clientName,
        website: data.website || '',
        apiKey,
        isActive: false,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    console.log(
      '✅ Client created successfully:',
      client.id,
      'with API key:',
      apiKey
    );
    return client;
  }

  /**
   * Get all clients by user ID
   */
  async getClientsByUserId(userId: string): Promise<any[]> {
    console.log('🔍 Getting all clients for user:', userId);

    const clients = await this.prisma.client.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        _count: {
          select: {
            leads: true,
            visitors: true,
            integrations: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return clients;
  }

  /**
   * Get first client by user ID (legacy method for backward compatibility)
   */
  async getFirstClientByUserId(userId: string): Promise<any> {
    console.log('🔍 Getting first client for user:', userId);

    const client = await this.prisma.client.findFirst({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found for user');
    }

    return client;
  }

  /**
   * Get specific client by ID for a user
   */
  async getClientById(clientId: string, userId: string): Promise<any> {
    console.log('🔍 Getting client:', clientId, 'for user:', userId);

    const client = await this.prisma.client.findFirst({
      where: {
        id: clientId,
        userId: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        _count: {
          select: {
            leads: true,
            visitors: true,
            integrations: true,
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  /**
   * Get client by API key
   */
  async getClientByApiKey(apiKey: string): Promise<any> {
    console.log('🔑 Getting client by API key');

    const client = await this.prisma.client.findUnique({
      where: { apiKey },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Invalid API key');
    }

    // if (!client.isActive) {
    //   throw new NotFoundException('Client account is inactive');
    // }

    return client;
  }

  /**
   * Update client information
   */
  async updateClient(
    userId: string,
    data: { name?: string; website?: string }
  ): Promise<any> {
    console.log('✏️ Updating client for user:', userId);

    const client = await this.prisma.client.findFirst({
      where: { userId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const updatedClient = await this.prisma.client.update({
      where: { id: client.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.website && { website: data.website }),
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    console.log('✅ Client updated successfully:', updatedClient.id);
    return updatedClient;
  }

  /**
   * Update a specific client by ID for a user
   */
  async updateClientById(
    clientId: string,
    userId: string,
    data: { name?: string; website?: string }
  ): Promise<any> {
    console.log('✏️ Updating client:', clientId, 'for user:', userId);

    // First, verify the client belongs to the user
    const client = await this.prisma.client.findFirst({
      where: {
        id: clientId,
        userId: userId,
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const updatedClient = await this.prisma.client.update({
      where: { id: clientId },
      data: {
        name: data.name || client.name,
        website: data.website || client.website,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    console.log('✅ Client updated successfully:', updatedClient.id);
    return updatedClient;
  }

  /**
   * Regenerate API key for a client
   */
  async regenerateApiKey(userId: string): Promise<any> {
    console.log('🔄 Regenerating API key for user:', userId);

    const client = await this.prisma.client.findFirst({
      where: { userId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    // Generate new unique API key
    let newApiKey: string;
    let isUnique = false;
    let attempts = 0;

    do {
      newApiKey = this.generateApiKey();
      const existing = await this.prisma.client.findUnique({
        where: { apiKey: newApiKey },
      });
      isUnique = !existing;
      attempts++;
    } while (!isUnique && attempts < 10);

    if (!isUnique) {
      throw new ConflictException('Unable to generate unique API key');
    }

    const updatedClient = await this.prisma.client.update({
      where: { id: client.id },
      data: {
        apiKey: newApiKey,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    console.log('✅ API key regenerated for client:', updatedClient.id);
    return updatedClient;
  }

  /**
   * Deactivate client
   */
  async deactivateClient(userId: string): Promise<any> {
    console.log('🚫 Deactivating client for user:', userId);

    const client = await this.prisma.client.findFirst({
      where: { userId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const updatedClient = await this.prisma.client.update({
      where: { id: client.id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    console.log('✅ Client deactivated:', updatedClient.id);
    return updatedClient;
  }

  /**
   * Delete a client by ID for a specific user
   */
  async deleteClient(clientId: string, userId: string): Promise<any> {
    console.log('🗑️ Deleting client:', clientId, 'for user:', userId);

    // First, verify the client belongs to the user
    const client = await this.prisma.client.findFirst({
      where: {
        id: clientId,
        userId: userId,
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    // Delete the client (cascade will handle related records)
    const deletedClient = await this.prisma.client.delete({
      where: { id: clientId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    console.log('✅ Client deleted:', deletedClient.id);
    return { message: 'Client deleted successfully', id: deletedClient.id };
  }

  /**
   * Check if tracking script is installed on the website
   */
  async checkScriptInstallation(
    clientId: string,
    userId: string
  ): Promise<any> {
    console.log('🔍 Checking script installation for client:', clientId);

    // First, verify the client belongs to the user
    const client = await this.prisma.client.findFirst({
      where: {
        id: clientId,
        userId: userId,
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    // In a real implementation, you would:
    // 1. Make a request to the website
    // 2. Check if the tracking script is present in the HTML
    // 3. Verify the script is working by checking for tracking events

    // For now, we'll simulate this by checking if the website is accessible
    // and if there are any visitors (which would indicate the script is working)
    const visitorCount = await this.prisma.visitor.count({
      where: { clientId },
    });

    const hasVisitors = visitorCount > 0;

    // Update the client's active status based on script detection
    const updatedClient = await this.prisma.client.update({
      where: { id: clientId },
      data: {
        isActive: hasVisitors,
        updatedAt: new Date(),
      },
    });

    console.log('✅ Script check completed:', {
      clientId,
      hasVisitors,
      isActive: updatedClient.isActive,
    });

    return {
      clientId,
      isActive: updatedClient.isActive,
      hasVisitors,
      visitorCount,
      message: hasVisitors
        ? 'Tracking script is active and working'
        : 'No tracking data found - script may not be installed',
    };
  }
}
