import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class HunterService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.hunter.io/v2';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('HUNTER_API_KEY');
  }

  async enrichByIp(ipAddress: string): Promise<any> {
    if (!this.apiKey) {
      console.log('⚠️ Hunter API key not configured');
      return null;
    }

    try {
      console.log('🔍 Enriching with Hunter for IP:', ipAddress);

      // Hunter doesn't have direct IP enrichment, so we'll use a placeholder approach
      // In production, you'd use a proper IP-to-domain service
      const domain = this.extractDomainFromIp(ipAddress);

      const response = await axios.get(`${this.baseUrl}/domain-search`, {
        params: {
          domain,
          api_key: this.apiKey,
          limit: 1,
        },
      });

      if (response.data?.data?.emails?.length > 0) {
        const email = response.data.data.emails[0];
        return {
          email: email.value,
          firstName: email.first_name,
          lastName: email.last_name,
          company: email.organization,
          title: email.position,
          confidence: email.confidence / 100,
        };
      }
    } catch (error) {
      console.error('❌ Hunter enrichment failed:', error.message);
    }

    return null;
  }

  async enrichByEmail(email: string): Promise<any> {
    if (!this.apiKey) {
      console.log('⚠️ Hunter API key not configured');
      return null;
    }

    try {
      console.log('🔍 Enriching with Hunter for email:', email);

      const response = await axios.get(`${this.baseUrl}/email-verifier`, {
        params: {
          email,
          api_key: this.apiKey,
        },
      });

      if (response.data?.data) {
        const data = response.data.data;
        return {
          email: data.email,
          firstName: data.first_name,
          lastName: data.last_name,
          company: data.organization,
          title: data.position,
          confidence: data.score / 100,
        };
      }
    } catch (error) {
      console.error('❌ Hunter email enrichment failed:', error.message);
    }

    return null;
  }

  private extractDomainFromIp(ipAddress: string): string {
    // This is a simplified approach - in production, you'd use a proper IP-to-domain service
    return 'example.com';
  }
}
