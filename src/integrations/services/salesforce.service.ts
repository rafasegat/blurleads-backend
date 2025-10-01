import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SalesforceService {
  async testConnection(config: any): Promise<any> {
    console.log('🧪 Testing Salesforce connection');

    try {
      const response = await axios.get(`${config.instanceUrl}/services/data/v52.0/sobjects/Account/describe`, {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      return {
        success: true,
        message: 'Salesforce connection successful',
        data: response.data,
      };
    } catch (error) {
      console.error('❌ Salesforce connection test failed:', error.message);
      return {
        success: false,
        message: 'Salesforce connection failed',
        error: error.message,
      };
    }
  }

  async createContact(lead: any, config: any): Promise<any> {
    console.log('👤 Creating Salesforce contact for lead:', lead.id);

    try {
      const contactData = {
        FirstName: lead.firstName,
        LastName: lead.lastName,
        Email: lead.email,
        Phone: lead.phone,
        Title: lead.title,
        Company: lead.company,
        Description: lead.description,
        Lead_Source__c: 'Website',
        Lead_Score__c: lead.score,
      };

      const response = await axios.post(
        `${config.instanceUrl}/services/data/v52.0/sobjects/Contact`,
        contactData,
        {
          headers: {
            'Authorization': `Bearer ${config.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ Salesforce contact created:', response.data.id);
      return {
        success: true,
        salesforceId: response.data.id,
        message: 'Contact created successfully',
      };
    } catch (error) {
      console.error('❌ Failed to create Salesforce contact:', error.message);
      return {
        success: false,
        message: 'Failed to create contact',
        error: error.message,
      };
    }
  }
}
