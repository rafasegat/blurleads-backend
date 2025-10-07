import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { EnrichmentService } from './enrichment.service';
import { EnrichmentProcessor } from './enrichment.processor';
import { ClearbitService } from './services/clearbit.service';
import { ApolloService } from './services/apollo.service';
import { HunterService } from './services/hunter.service';
import { CompanyEnrichmentService } from './services/company-enrichment.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'enrichment',
    }),
  ],
  providers: [
    EnrichmentService,
    EnrichmentProcessor,
    ClearbitService,
    ApolloService,
    HunterService,
    CompanyEnrichmentService,
  ],
  exports: [EnrichmentService, CompanyEnrichmentService],
})
export class EnrichmentModule {}
