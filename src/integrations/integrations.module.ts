import { Module } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { SalesforceService } from './services/salesforce.service';
import { HubspotService } from './services/hubspot.service';
import { PipedriveService } from './services/pipedrive.service';

@Module({
  providers: [
    IntegrationsService,
    SalesforceService,
    HubspotService,
    PipedriveService,
  ],
  controllers: [IntegrationsController],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
