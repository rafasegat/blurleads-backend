import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { SalesforceService } from './services/salesforce.service';
import { HubspotService } from './services/hubspot.service';
import { PipedriveService } from './services/pipedrive.service';

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly salesforceService: SalesforceService,
    private readonly hubspotService: HubspotService,
    private readonly pipedriveService: PipedriveService,
  ) {}

  async getIntegrations(userId: string, clientId?: string): Promise<any[]> {
    console.log('🔌 Getting integrations for user:', userId);

    const where: any = { userId };
    if (clientId) {
      where.clientId = clientId;
    }

    const integrations = await this.prisma.integration.findMany({
      where,
      include: { client: true },
      orderBy: { createdAt: 'desc' },
    });

    return integrations;
  }

  async createIntegration(
    userId: string,
    clientId: string,
    type: string,
    name: string,
    config: any,
  ): Promise<any> {
    console.log('🔌 Creating integration:', type, 'for client:', clientId);

    const integration = await this.prisma.integration.create({
      data: {
        type: type as any,
        name,
        config,
        clientId,
        userId,
      },
    });

    console.log('✅ Integration created:', integration.id);
    return integration;
  }

  async updateIntegration(
    id: string,
    userId: string,
    updates: any,
  ): Promise<any> {
    console.log('🔌 Updating integration:', id);

    const integration = await this.prisma.integration.findFirst({
      where: { id, userId },
    });

    if (!integration) {
      throw new NotFoundException('Integration not found');
    }

    const updatedIntegration = await this.prisma.integration.update({
      where: { id },
      data: updates,
    });

    console.log('✅ Integration updated:', id);
    return updatedIntegration;
  }

  async deleteIntegration(id: string, userId: string): Promise<void> {
    console.log('🔌 Deleting integration:', id);

    const integration = await this.prisma.integration.findFirst({
      where: { id, userId },
    });

    if (!integration) {
      throw new NotFoundException('Integration not found');
    }

    await this.prisma.integration.delete({
      where: { id },
    });

    console.log('✅ Integration deleted:', id);
  }

  async syncLeadToIntegration(leadId: string, integrationId: string): Promise<any> {
    console.log('🔄 Syncing lead to integration:', leadId, 'to', integrationId);

    const [lead, integration] = await Promise.all([
      this.prisma.lead.findUnique({
        where: { id: leadId },
        include: { client: true },
      }),
      this.prisma.integration.findUnique({
        where: { id: integrationId },
      }),
    ]);

    if (!lead || !integration) {
      throw new NotFoundException('Lead or integration not found');
    }

    let result;
    switch (integration.type) {
      case 'SALESFORCE':
        result = await this.salesforceService.createContact(lead, integration.config);
        break;
      case 'HUBSPOT':
        result = await this.hubspotService.createContact(lead, integration.config);
        break;
      case 'PIPEDRIVE':
        result = await this.pipedriveService.createPerson(lead, integration.config);
        break;
      default:
        throw new Error(`Unsupported integration type: ${integration.type}`);
    }

    console.log('✅ Lead synced to integration:', integration.type);
    return result;
  }

  async testIntegration(integrationId: string, userId: string): Promise<any> {
    console.log('🧪 Testing integration:', integrationId);

    const integration = await this.prisma.integration.findFirst({
      where: { id: integrationId, userId },
    });

    if (!integration) {
      throw new NotFoundException('Integration not found');
    }

    let result;
    switch (integration.type) {
      case 'SALESFORCE':
        result = await this.salesforceService.testConnection(integration.config);
        break;
      case 'HUBSPOT':
        result = await this.hubspotService.testConnection(integration.config);
        break;
      case 'PIPEDRIVE':
        result = await this.pipedriveService.testConnection(integration.config);
        break;
      default:
        throw new Error(`Unsupported integration type: ${integration.type}`);
    }

    console.log('✅ Integration test completed:', integration.type);
    return result;
  }
}
