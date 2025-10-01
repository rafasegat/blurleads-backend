import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class ClearbitService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://company.clearbit.com/v2';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('CLEARBIT_API_KEY');
  }

  async enrichByIp(ipAddress: string): Promise<any> {
    if (!this.apiKey) {
      console.log('⚠️ Clearbit API key not configured');
      return null;
    }

    try {
      console.log('🔍 Enriching with Clearbit for IP:', ipAddress);

      // First, get company info by IP
      const companyResponse = await axios.get(`${this.baseUrl}/companies/find`, {
        params: { domain: this.extractDomainFromIp(ipAddress) },
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (companyResponse.data) {
        return {
          company: companyResponse.data.name,
          domain: companyResponse.data.domain,
          industry: companyResponse.data.category?.industry,
          description: companyResponse.data.description,
          website: companyResponse.data.domain,
          location: companyResponse.data.location,
          confidence: 0.8,
        };
      }
    } catch (error) {
      console.error('❌ Clearbit enrichment failed:', error.message);
    }

    return null;
  }

  async enrichByEmail(email: string): Promise<any> {
    if (!this.apiKey) {
      console.log('⚠️ Clearbit API key not configured');
      return null;
    }

    try {
      console.log('🔍 Enriching with Clearbit for email:', email);

      const response = await axios.get(`${this.baseUrl}/people/find`, {
        params: { email },
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (response.data) {
        return {
          firstName: response.data.name?.givenName,
          lastName: response.data.name?.familyName,
          email: response.data.email,
          company: response.data.employment?.name,
          title: response.data.employment?.title,
          linkedinUrl: response.data.linkedin?.handle,
          twitterUrl: response.data.twitter?.handle,
          website: response.data.site?.handle,
          location: response.data.location,
          confidence: 0.9,
        };
      }
    } catch (error) {
      console.error('❌ Clearbit email enrichment failed:', error.message);
    }

    return null;
  }

  private extractDomainFromIp(ipAddress: string): string {
    // This is a simplified approach - in production, you'd use a proper IP-to-domain service
    // For now, we'll return a placeholder
    return 'example.com';
  }
}
