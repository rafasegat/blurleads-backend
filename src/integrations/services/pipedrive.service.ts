import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class PipedriveService {
  async testConnection(config: any): Promise<any> {
    console.log('🧪 Testing Pipedrive connection');

    try {
      const response = await axios.get('https://api.pipedrive.com/v1/users/me', {
        params: { api_token: config.apiToken },
      });

      return {
        success: true,
        message: 'Pipedrive connection successful',
        data: response.data,
      };
    } catch (error) {
      console.error('❌ Pipedrive connection test failed:', error.message);
      return {
        success: false,
        message: 'Pipedrive connection failed',
        error: error.message,
      };
    }
  }

  async createPerson(lead: any, config: any): Promise<any> {
    console.log('👤 Creating Pipedrive person for lead:', lead.id);

    try {
      const personData = {
        name: `${lead.firstName || ''} ${lead.lastName || ''}`.trim(),
        email: lead.email,
        phone: lead.phone,
        org_name: lead.company,
        owner_id: config.ownerId,
        visible_to: '3', // Everyone
        add_time: new Date().toISOString(),
      };

      const response = await axios.post(
        'https://api.pipedrive.com/v1/persons',
        personData,
        {
          params: { api_token: config.apiToken },
        }
      );

      console.log('✅ Pipedrive person created:', response.data.data.id);
      return {
        success: true,
        pipedriveId: response.data.data.id,
        message: 'Person created successfully',
      };
    } catch (error) {
      console.error('❌ Failed to create Pipedrive person:', error.message);
      return {
        success: false,
        message: 'Failed to create person',
        error: error.message,
      };
    }
  }
}
