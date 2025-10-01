import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { EnrichmentService } from './enrichment.service';

@Processor('enrichment')
export class EnrichmentProcessor {
  constructor(private readonly enrichmentService: EnrichmentService) {}

  @Process('enrich-visitor')
  async handleEnrichVisitor(job: Job<{
    visitorId: string;
    ipAddress: string;
    userAgent?: string;
    clientId: string;
    userId: string;
  }>): Promise<void> {
    console.log('🔄 Processing enrichment job:', job.id);

    const { visitorId, ipAddress, userAgent } = job.data;

    try {
      await this.enrichmentService.enrichVisitor(visitorId, ipAddress, userAgent);
      console.log('✅ Enrichment job completed:', job.id);
    } catch (error) {
      console.error('❌ Enrichment job failed:', job.id, error);
      throw error;
    }
  }
}
