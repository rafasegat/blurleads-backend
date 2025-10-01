import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../common/prisma/prisma.service';

interface TrackingEvent {
  pageUrl: string;
  referrer?: string;
  userAgent?: string;
  sessionId: string;
  ipAddress?: string;
}

@Injectable()
export class TrackingService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('enrichment') private readonly enrichmentQueue: Queue
  ) {}

  async createTrackingEvent(
    apiKey: string,
    trackingData: TrackingEvent
  ): Promise<any> {
    console.log('📊 Processing tracking event for API key:', apiKey);

    // Find client by API key
    const client = await this.prisma.client.findUnique({
      where: { apiKey },
      include: { user: true },
    });

    if (!client) {
      throw new NotFoundException('Invalid API key');
    }

    if (!client.isActive) {
      throw new NotFoundException('Client account is inactive');
    }

    // Create visitor record
    const visitor = await this.prisma.visitor.create({
      data: {
        ipAddress: trackingData.ipAddress,
        userAgent: trackingData.userAgent,
        referrer: trackingData.referrer,
        pageUrl: trackingData.pageUrl,
        sessionId: trackingData.sessionId,
        clientId: client.id,
      },
    });

    console.log('✅ Visitor record created:', visitor.id);

    // Queue enrichment job
    await this.enrichmentQueue.add('enrich-visitor', {
      visitorId: visitor.id,
      ipAddress: trackingData.ipAddress,
      userAgent: trackingData.userAgent,
      pageUrl: trackingData.pageUrl,
      clientId: client.id,
      userId: client.userId,
    });

    console.log('🔄 Enrichment job queued for visitor:', visitor.id);

    return {
      success: true,
      visitorId: visitor.id,
      message: 'Tracking event recorded and enrichment queued',
    };
  }

  async getClientByApiKey(apiKey: string): Promise<any> {
    console.log('🔍 Looking up client by API key');

    const client = await this.prisma.client.findUnique({
      where: { apiKey },
      include: { user: true },
    });

    if (!client) {
      throw new NotFoundException('Invalid API key');
    }

    return client;
  }

  async getTrackingStats(clientId: string): Promise<any> {
    console.log('📈 Getting tracking stats for client:', clientId);

    const [totalVisitors, enrichedVisitors, recentVisitors] = await Promise.all(
      [
        this.prisma.visitor.count({
          where: { clientId },
        }),
        this.prisma.visitor.count({
          where: { clientId, isEnriched: true },
        }),
        this.prisma.visitor.findMany({
          where: { clientId },
          orderBy: { timestamp: 'desc' },
          take: 10,
          select: {
            id: true,
            ipAddress: true,
            pageUrl: true,
            timestamp: true,
            isEnriched: true,
          },
        }),
      ]
    );

    return {
      totalVisitors,
      enrichedVisitors,
      enrichmentRate:
        totalVisitors > 0 ? (enrichedVisitors / totalVisitors) * 100 : 0,
      recentVisitors,
    };
  }
}
