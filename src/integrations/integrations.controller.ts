import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { IntegrationsService } from './integrations.service';
import { Prisma, IntegrationType } from '@prisma/client';

@ApiTags('Integrations')
@Controller('integrations')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all integrations' })
  @ApiResponse({
    status: 200,
    description: 'Integrations retrieved successfully',
  })
  async getIntegrations(@Param('clientId') clientId?: string) {
    console.log('🔌 Getting integrations');
    return this.integrationsService.getIntegrations('user-id', clientId);
  }

  @Post()
  @ApiOperation({ summary: 'Create new integration' })
  @ApiResponse({ status: 201, description: 'Integration created successfully' })
  async createIntegration(
    @Body()
    integrationData: {
      clientId: string;
      type: IntegrationType;
      name: string;
      config: Record<string, any>;
    }
  ) {
    console.log('🔌 Creating integration');
    return this.integrationsService.createIntegration(
      'user-id',
      integrationData.clientId,
      integrationData.type,
      integrationData.name,
      integrationData.config
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update integration' })
  @ApiResponse({ status: 200, description: 'Integration updated successfully' })
  async updateIntegration(
    @Param('id') id: string,
    @Body() updateData: Prisma.IntegrationUpdateInput
  ) {
    console.log('🔌 Updating integration:', id);
    return this.integrationsService.updateIntegration(
      id,
      'user-id',
      updateData
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete integration' })
  @ApiResponse({ status: 200, description: 'Integration deleted successfully' })
  async deleteIntegration(@Param('id') id: string) {
    console.log('🔌 Deleting integration:', id);
    return this.integrationsService.deleteIntegration(id, 'user-id');
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Test integration connection' })
  @ApiResponse({ status: 200, description: 'Integration test completed' })
  async testIntegration(@Param('id') id: string) {
    console.log('🧪 Testing integration:', id);
    return this.integrationsService.testIntegration(id, 'user-id');
  }

  @Post(':id/sync/:leadId')
  @ApiOperation({ summary: 'Sync lead to integration' })
  @ApiResponse({ status: 200, description: 'Lead synced successfully' })
  async syncLeadToIntegration(
    @Param('id') integrationId: string,
    @Param('leadId') leadId: string
  ) {
    console.log('🔄 Syncing lead to integration:', leadId, 'to', integrationId);
    return this.integrationsService.syncLeadToIntegration(
      leadId,
      integrationId
    );
  }
}
