import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LeadsService } from './leads.service';

@ApiTags('Leads')
@Controller('leads')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @ApiOperation({ summary: 'Get leads with pagination' })
  @ApiResponse({ status: 200, description: 'Leads retrieved successfully' })
  async getLeads(
    @Query('clientId') clientId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    console.log('📋 Getting leads');
    return this.leadsService.getLeads('user-id', clientId, page, limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get lead statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getLeadStats(@Query('clientId') clientId?: string) {
    console.log('📊 Getting lead stats');
    return this.leadsService.getLeadStats('user-id', clientId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search leads' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  async searchLeads(
    @Query('q') query: string,
    @Query('clientId') clientId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    console.log('🔍 Searching leads');
    return this.leadsService.searchLeads('user-id', query, clientId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lead by ID' })
  @ApiResponse({ status: 200, description: 'Lead retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async getLeadById(@Param('id') id: string) {
    console.log('📋 Getting lead by ID:', id);
    return this.leadsService.getLeadById(id, 'user-id');
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update lead status' })
  @ApiResponse({ status: 200, description: 'Lead status updated successfully' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async updateLeadStatus(
    @Param('id') id: string,
    @Query('status') status: string,
  ) {
    console.log('📋 Updating lead status:', id, 'to', status);
    return this.leadsService.updateLeadStatus(id, status, 'user-id');
  }
}
