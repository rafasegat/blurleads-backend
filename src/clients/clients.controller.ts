import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { ClientsService } from './clients.service';

@ApiTags('Clients')
@Controller('clients')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @ApiOperation({ summary: "Get current user's clients" })
  @ApiResponse({ status: 200, description: 'Clients retrieved successfully' })
  async getClients(@Request() req: any) {
    console.log('📋 Getting clients for user:', req.user.id);
    return this.clientsService.getClientsByUserId(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific client by ID' })
  @ApiResponse({ status: 200, description: 'Client retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async getClient(@Request() req: any, @Param('id') clientId: string) {
    console.log('📋 Getting client:', clientId, 'for user:', req.user.id);
    return this.clientsService.getClientById(clientId, req.user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new client for the current user' })
  @ApiResponse({ status: 201, description: 'Client created successfully' })
  @ApiResponse({ status: 409, description: 'Client already exists' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Client name' },
        website: { type: 'string', description: 'Website URL' },
      },
      required: [],
    },
  })
  async createClient(
    @Request() req: any,
    @Body() data: { name?: string; website?: string }
  ) {
    console.log('🏢 Creating client for user:', req.user.id);
    return this.clientsService.createClient(req.user.id, data);
  }

  @Put()
  @ApiOperation({ summary: "Update current user's first client" })
  @ApiResponse({ status: 200, description: 'Client updated successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Client name' },
        website: { type: 'string', description: 'Website URL' },
      },
      required: [],
    },
  })
  async updateClient(
    @Request() req: any,
    @Body() data: { name?: string; website?: string }
  ) {
    console.log('✏️ Updating client for user:', req.user.id);
    return this.clientsService.updateClient(req.user.id, data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update specific client by ID' })
  @ApiResponse({ status: 200, description: 'Client updated successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Client name' },
        website: { type: 'string', description: 'Website URL' },
      },
      required: [],
    },
  })
  async updateClientById(
    @Request() req: any,
    @Param('id') clientId: string,
    @Body() data: { name?: string; website?: string }
  ) {
    console.log('✏️ Updating client:', clientId, 'for user:', req.user.id);
    return this.clientsService.updateClientById(clientId, req.user.id, data);
  }

  @Post('regenerate-api-key')
  @ApiOperation({ summary: "Regenerate API key for current user's client" })
  @ApiResponse({ status: 200, description: 'API key regenerated successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async regenerateApiKey(@Request() req: any) {
    console.log('🔄 Regenerating API key for user:', req.user.id);
    return this.clientsService.regenerateApiKey(req.user.id);
  }

  @Put('deactivate')
  @ApiOperation({ summary: "Deactivate current user's client" })
  @ApiResponse({ status: 200, description: 'Client deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async deactivateClient(@Request() req: any) {
    console.log('🚫 Deactivating client for user:', req.user.id);
    return this.clientsService.deactivateClient(req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete specific client by ID' })
  @ApiResponse({ status: 200, description: 'Client deleted successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async deleteClient(@Request() req: any, @Param('id') clientId: string) {
    console.log('🗑️ Deleting client:', clientId, 'for user:', req.user.id);
    return this.clientsService.deleteClient(clientId, req.user.id);
  }

  @Post(':id/check-script')
  @ApiOperation({ summary: 'Check if tracking script is installed on website' })
  @ApiResponse({ status: 200, description: 'Script status checked' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async checkScriptInstallation(
    @Request() req: any,
    @Param('id') clientId: string
  ) {
    console.log('🔍 Checking script installation for client:', clientId);
    return this.clientsService.checkScriptInstallation(clientId, req.user.id);
  }
}
