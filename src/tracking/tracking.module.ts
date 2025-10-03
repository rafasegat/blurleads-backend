import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TrackingService } from './tracking.service';
import { TrackingController } from './tracking.controller';
import { EnrichmentModule } from '../enrichment/enrichment.module';
import { ClientsModule } from '../clients/clients.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'enrichment',
    }),
    EnrichmentModule,
    ClientsModule,
  ],
  providers: [TrackingService],
  controllers: [TrackingController],
  exports: [TrackingService],
})
export class TrackingModule {}
