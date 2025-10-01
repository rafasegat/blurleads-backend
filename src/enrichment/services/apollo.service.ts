import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class ApolloService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.apollo.io/v1';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('APOLLO_API_KEY');
  }

  async enrichByIp(ipAddress: string): Promise<any> {
    if (!this.apiKey) {
      console.log('⚠️ Apollo API key not configured');
      return null;
    }

    try {
      console.log('🔍 Enriching with Apollo for IP:', ipAddress);

      // Apollo doesn't have direct IP enrichment, so we'll use a placeholder approach
      // In production, you'd use a proper IP-to-company mapping service
      const domain = this.extractDomainFromIp(ipAddress);

      const response = await axios.post(`${this.baseUrl}/mixed_companies/search`, {
        q_organization_domains: domain,
        page: 1,
        per_page: 1,
      }, {
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json',
          'X-Api-Key': this.apiKey,
        },
      });

      if (response.data?.organizations?.length > 0) {
        const org = response.data.organizations[0];
        return {
          company: org.name,
          domain: org.primary_domain,
          industry: org.industry,
          description: org.short_description,
          website: org.website_url,
          location: org.city + ', ' + org.state,
          companySize: org.estimated_num_employees,
          confidence: 0.7,
        };
      }
    } catch (error) {
      console.error('❌ Apollo enrichment failed:', error.message);
    }

    return null;
  }

  async enrichByEmail(email: string): Promise<any> {
    if (!this.apiKey) {
      console.log('⚠️ Apollo API key not configured');
      return null;
    }

    try {
      console.log('🔍 Enriching with Apollo for email:', email);

      const response = await axios.post(`${this.baseUrl}/mixed_people/search`, {
        q_emails: email,
        page: 1,
        per_page: 1,
      }, {
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json',
          'X-Api-Key': this.apiKey,
        },
      });

      if (response.data?.people?.length > 0) {
        const person = response.data.people[0];
        return {
          firstName: person.first_name,
          lastName: person.last_name,
          email: person.email,
          company: person.organization?.name,
          title: person.title,
          linkedinUrl: person.linkedin_url,
          twitterUrl: person.twitter_url,
          website: person.organization?.website_url,
          location: person.city + ', ' + person.state,
          confidence: 0.8,
        };
      }
    } catch (error) {
      console.error('❌ Apollo email enrichment failed:', error.message);
    }

    return null;
  }

  private extractDomainFromIp(ipAddress: string): string {
    // This is a simplified approach - in production, you'd use a proper IP-to-domain service
    return 'example.com';
  }
}
