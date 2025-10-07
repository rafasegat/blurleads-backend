import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../common/prisma/prisma.service';
import { ClientsService } from '../clients/clients.service';
import { CompanyEnrichmentService } from '../enrichment/services/company-enrichment.service';

interface TrackingEvent {
  pageUrl: string;
  referrer?: string;
  userAgent?: string;
  sessionId: string;
  ipAddress?: string;
}

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly clientsService: ClientsService,
    private readonly companyEnrichment: CompanyEnrichmentService,
    @InjectQueue('enrichment') private readonly enrichmentQueue: Queue
  ) {}

  async createTrackingEvent(
    apiKey: string,
    trackingData: TrackingEvent
  ): Promise<any> {
    this.logger.log('📊 Processing tracking event for API key:', apiKey);

    // Find client by API key using ClientsService
    const client = await this.clientsService.getClientByApiKey(apiKey);

    // Identify company from IP address
    let companyId: string | undefined;
    if (trackingData.ipAddress) {
      try {
        const companyData = await this.companyEnrichment.identifyCompanyFromIP(
          trackingData.ipAddress
        );

        if (companyData) {
          // Enrich company data if domain is available
          if (companyData.domain) {
            const enrichedData = await this.companyEnrichment.enrichCompanyData(
              companyData.domain
            );
            if (enrichedData) {
              Object.assign(companyData, enrichedData);
            }
          }

          // Store company in database
          const company =
            await this.companyEnrichment.upsertCompany(companyData);
          if (company) {
            companyId = company.id;
            this.logger.log(`🏢 Company identified: ${company.name}`);
          }
        }
      } catch (error) {
        this.logger.error(`Error identifying company: ${error.message}`);
      }
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
        companyId,
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
    return this.clientsService.getClientByApiKey(apiKey);
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
