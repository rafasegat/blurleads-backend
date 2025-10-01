import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ClearbitService } from './services/clearbit.service';
import { ApolloService } from './services/apollo.service';
import { HunterService } from './services/hunter.service';

export interface EnrichmentResult {
  provider: string;
  data: any;
  confidence: number;
}

@Injectable()
export class EnrichmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clearbitService: ClearbitService,
    private readonly apolloService: ApolloService,
    private readonly hunterService: HunterService,
  ) {}

  async enrichVisitor(visitorId: string, ipAddress: string, userAgent?: string): Promise<void> {
    console.log('🔍 Starting enrichment for visitor:', visitorId);

    try {
      // Get visitor data
      const visitor = await this.prisma.visitor.findUnique({
        where: { id: visitorId },
        include: { client: true },
      });

      if (!visitor) {
        console.error('❌ Visitor not found:', visitorId);
        return;
      }

      // Run enrichment in parallel
      const enrichmentPromises = [
        this.enrichWithClearbit(ipAddress, userAgent),
        this.enrichWithApollo(ipAddress, userAgent),
        this.enrichWithHunter(ipAddress, userAgent),
      ];

      const results = await Promise.allSettled(enrichmentPromises);

      // Process results and create leads
      const enrichmentResults: EnrichmentResult[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          const providers = ['clearbit', 'apollo', 'hunter'];
          enrichmentResults.push({
            provider: providers[index],
            data: result.value,
            confidence: result.value.confidence || 0.5,
          });
        }
      });

      if (enrichmentResults.length > 0) {
        await this.createLeadFromEnrichment(visitor, enrichmentResults);
      }

      // Mark visitor as enriched
      await this.prisma.visitor.update({
        where: { id: visitorId },
        data: { isEnriched: true },
      });

      console.log('✅ Enrichment completed for visitor:', visitorId);
    } catch (error) {
      console.error('❌ Enrichment failed for visitor:', visitorId, error);
    }
  }

  private async enrichWithClearbit(ipAddress: string, userAgent?: string): Promise<any> {
    try {
      console.log('🔍 Enriching with Clearbit for IP:', ipAddress);
      return await this.clearbitService.enrichByIp(ipAddress);
    } catch (error) {
      console.error('❌ Clearbit enrichment failed:', error);
      return null;
    }
  }

  private async enrichWithApollo(ipAddress: string, userAgent?: string): Promise<any> {
    try {
      console.log('🔍 Enriching with Apollo for IP:', ipAddress);
      return await this.apolloService.enrichByIp(ipAddress);
    } catch (error) {
      console.error('❌ Apollo enrichment failed:', error);
      return null;
    }
  }

  private async enrichWithHunter(ipAddress: string, userAgent?: string): Promise<any> {
    try {
      console.log('🔍 Enriching with Hunter for IP:', ipAddress);
      return await this.hunterService.enrichByIp(ipAddress);
    } catch (error) {
      console.error('❌ Hunter enrichment failed:', error);
      return null;
    }
  }

  private async createLeadFromEnrichment(
    visitor: any,
    enrichmentResults: EnrichmentResult[],
  ): Promise<void> {
    console.log('👤 Creating lead from enrichment data');

    // Merge enrichment data
    const mergedData = this.mergeEnrichmentData(enrichmentResults);

    if (!mergedData.email && !mergedData.company) {
      console.log('⚠️ No sufficient data to create lead');
      return;
    }

    // Create lead
    const lead = await this.prisma.lead.create({
      data: {
        email: mergedData.email,
        firstName: mergedData.firstName,
        lastName: mergedData.lastName,
        company: mergedData.company,
        title: mergedData.title,
        phone: mergedData.phone,
        linkedinUrl: mergedData.linkedinUrl,
        facebookUrl: mergedData.facebookUrl,
        instagramUrl: mergedData.instagramUrl,
        twitterUrl: mergedData.twitterUrl,
        website: mergedData.website,
        location: mergedData.location,
        industry: mergedData.industry,
        companySize: mergedData.companySize,
        revenue: mergedData.revenue,
        description: mergedData.description,
        score: this.calculateLeadScore(mergedData),
        source: 'enrichment',
        clientId: visitor.clientId,
        visitorId: visitor.id,
        userId: visitor.client.userId,
      },
    });

    // Store enrichment data
    for (const result of enrichmentResults) {
      await this.prisma.enrichmentData.create({
        data: {
          provider: result.provider,
          data: result.data,
          confidence: result.confidence,
          leadId: lead.id,
        },
      });
    }

    console.log('✅ Lead created:', lead.id);
  }

  private mergeEnrichmentData(results: EnrichmentResult[]): any {
    const merged: any = {};

    results.forEach(result => {
      if (result.data) {
        Object.assign(merged, result.data);
      }
    });

    return merged;
  }

  private calculateLeadScore(data: any): number {
    let score = 0;

    if (data.email) score += 30;
    if (data.firstName && data.lastName) score += 20;
    if (data.company) score += 20;
    if (data.title) score += 10;
    if (data.phone) score += 10;
    if (data.linkedinUrl) score += 5;
    if (data.website) score += 5;

    return Math.min(score, 100);
  }
}
