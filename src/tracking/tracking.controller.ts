import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Headers,
  UseGuards,
  Header,
  Options,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { TrackingService } from './tracking.service';
import { Prisma } from '@prisma/client';

@ApiTags('Tracking')
@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post('event')
  @Header('Access-Control-Allow-Origin', '*')
  @Header('Access-Control-Allow-Methods', 'POST, OPTIONS')
  @Header('Access-Control-Allow-Headers', 'Content-Type, x-api-key')
  @ApiOperation({ summary: 'Record a visitor tracking event' })
  @ApiHeader({ name: 'x-api-key', description: 'Client API key' })
  @ApiResponse({ status: 201, description: 'Event recorded successfully' })
  @ApiResponse({ status: 404, description: 'Invalid API key' })
  async createTrackingEvent(
    @Headers('x-api-key') apiKey: string,
    @Body()
    trackingData: {
      pageUrl: string;
      referrer?: string;
      userAgent?: string;
      sessionId: string;
      ipAddress?: string;
      contactInfo?: {
        emails: string[];
        phones: string[];
        socialProfiles: Array<{
          platform: string;
          url: string;
          username: string | null;
        }>;
      };
    }
  ) {
    console.log('📊 Tracking event received');
    return this.trackingService.createTrackingEvent(apiKey, trackingData);
  }

  @Options('event')
  @Header('Access-Control-Allow-Origin', '*')
  @Header('Access-Control-Allow-Methods', 'POST, OPTIONS')
  @Header('Access-Control-Allow-Headers', 'Content-Type, x-api-key')
  @Header('Access-Control-Max-Age', '86400')
  handleOptions(@Res() res: Response) {
    res.status(200).end();
  }

  @Get('stats')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get tracking statistics for authenticated client' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getTrackingStats(@Query('clientId') clientId: string) {
    console.log('📈 Tracking stats requested');
    return this.trackingService.getTrackingStats(clientId);
  }
}
