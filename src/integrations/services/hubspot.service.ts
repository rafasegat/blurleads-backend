import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class HubspotService {
  async testConnection(config: any): Promise<any> {
    console.log('🧪 Testing HubSpot connection');

    try {
      const response = await axios.get('https://api.hubapi.com/crm/v3/objects/contacts', {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        params: { limit: 1 },
      });

      return {
        success: true,
        message: 'HubSpot connection successful',
        data: response.data,
      };
    } catch (error) {
      console.error('❌ HubSpot connection test failed:', error.message);
      return {
        success: false,
        message: 'HubSpot connection failed',
        error: error.message,
      };
    }
  }

  async createContact(lead: any, config: any): Promise<any> {
    console.log('👤 Creating HubSpot contact for lead:', lead.id);

    try {
      const contactData = {
        properties: {
          firstname: lead.firstName,
          lastname: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          jobtitle: lead.title,
          company: lead.company,
          lifecyclestage: 'lead',
          lead_status: 'new',
          lead_score: lead.score?.toString(),
          notes_last_contacted: new Date().toISOString(),
        },
      };

      const response = await axios.post(
        'https://api.hubapi.com/crm/v3/objects/contacts',
        contactData,
        {
          headers: {
            'Authorization': `Bearer ${config.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ HubSpot contact created:', response.data.id);
      return {
        success: true,
        hubspotId: response.data.id,
        message: 'Contact created successfully',
      };
    } catch (error) {
      console.error('❌ Failed to create HubSpot contact:', error.message);
      return {
        success: false,
        message: 'Failed to create contact',
        error: error.message,
      };
    }
  }
}
