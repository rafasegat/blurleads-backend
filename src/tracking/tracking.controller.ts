import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Headers,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TrackingService } from './tracking.service';
import { Prisma } from '@prisma/client';

@ApiTags('Tracking')
@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post('event')
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
    }
  ) {
    console.log('📊 Tracking event received');
    return this.trackingService.createTrackingEvent(apiKey, trackingData);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
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
