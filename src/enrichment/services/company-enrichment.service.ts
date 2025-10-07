import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import axios from 'axios';

interface CompanyData {
  domain?: string;
  name?: string;
  industry?: string;
  size?: string;
  location?: string;
  country?: string;
  city?: string;
  revenue?: string;
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  description?: string;
  logo?: string;
  employees?: number;
  founded?: string;
  technologies?: string[];
  // Additional enrich.so fields
  legalName?: string;
  domainAliases?: string[];
  phoneNumbers?: string[];
  emailAddresses?: string[];
  sector?: string;
  industryGroup?: string;
  subIndustry?: string;
  tags?: string[];
  foundedYear?: number;
  timeZone?: string;
  utcOffset?: number;
  streetAddress?: string;
  postalCode?: string;
  state?: string;
  stateCode?: string;
  countryCode?: string;
  lat?: number;
  lng?: number;
  crunchbase?: string;
  type?: string;
  duns?: string;
  ein?: string;
  alexaGlobalRank?: number;
  trafficRank?: string;
  raised?: number;
  parent?: {
    id: string;
    name: string;
  };
  ultimateParent?: {
    id: string;
    name: string;
  };
}

@Injectable()
export class CompanyEnrichmentService {
  private readonly logger = new Logger(CompanyEnrichmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Identify company from IP address
   */
  async identifyCompanyFromIP(ipAddress: string): Promise<CompanyData | null> {
    try {
      this.logger.log(`🔍 Identifying company from IP: ${ipAddress}`);

      // Try enrich.so first (primary service)
      let companyData = await this.tryEnrichSo(ipAddress);
      console.log('🔍 Enrich.so found company: ', companyData);

      if (!companyData) {
        // Fallback to other services
        companyData = await this.tryIPData(ipAddress);
        console.log('🔍 IPData.co found company: ', companyData);
      }

      if (!companyData) {
        companyData = await this.tryIPAPI(ipAddress);
        console.log('🔍 IP-API.com found company: ', companyData);
      }

      if (!companyData) {
        companyData = await this.tryIPInfo(ipAddress);
        console.log('🔍 IPInfo.io found company: ', companyData);
      }

      if (companyData) {
        this.logger.log(
          `✅ Company identified: ${companyData.name || 'Unknown'}`
        );
        return companyData;
      }

      this.logger.log(`❌ No company found for IP: ${ipAddress}`);
      return null;
    } catch (error) {
      this.logger.error(`Error identifying company from IP: ${error.message}`);
      return null;
    }
  }

  /**
   * Try enrich.so API (Primary service)
   * https://enrich.so/
   */
  private async tryEnrichSo(ipAddress: string): Promise<CompanyData | null> {
    try {
      const apiKey = process.env.ENRICH_SO_API_KEY;
      if (!apiKey) {
        this.logger.debug('ENRICH_SO_API_KEY not configured');
        return null;
      }

      this.logger.log(`🔍 Looking up IP ${ipAddress} on enrich.so`);

      const response = await axios.get(
        'https://api.enrich.so/v1/api/ip-to-company-lookup',
        {
          params: {
            ip: ipAddress,
          },
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data && response.data.success && response.data.data) {
        const data = response.data.data;

        this.logger.log(`✅ Enrich.so found company: ${data.name}`);

        return {
          domain: data.domain,
          name: data.name,
          legalName: data.legalName,
          domainAliases: data.domainAliases,
          industry: data.category?.industry,
          sector: data.category?.sector,
          industryGroup: data.category?.industryGroup,
          subIndustry: data.category?.subIndustry,
          size: data.metrics?.employeesRange,
          location: data.location,
          country: data.geo?.country,
          city: data.geo?.city,
          streetAddress: data.geo?.streetAddress,
          postalCode: data.geo?.postalCode,
          state: data.geo?.state,
          stateCode: data.geo?.stateCode,
          countryCode: data.geo?.countryCode,
          lat: data.geo?.lat,
          lng: data.geo?.lng,
          revenue: data.metrics?.estimatedAnnualRevenue,
          linkedin: data.linkedin?.handle,
          twitter: data.twitter?.handle,
          facebook: data.facebook?.handle,
          crunchbase: data.crunchbase?.handle,
          description: data.description,
          logo: data.logo,
          employees: data.metrics?.employees,
          founded: data.foundedYear?.toString(),
          foundedYear: data.foundedYear,
          technologies: data.tech || [],
          tags: data.tags,
          timeZone: data.timeZone,
          utcOffset: data.utcOffset,
          type: data.type,
          duns: data.identifiers?.duns,
          ein: data.identifiers?.ein,
          alexaGlobalRank: data.metrics?.alexaGlobalRank,
          trafficRank: data.metrics?.trafficRank,
          raised: data.metrics?.raised,
          parent: data.parent,
          ultimateParent: data.ultimateParent,
          phoneNumbers: data.site?.phoneNumbers,
          emailAddresses: data.site?.emailAddresses,
        };
      }

      return null;
    } catch (error) {
      this.logger.debug(`Enrich.so lookup failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Try IPData.co API
   * https://ipdata.co/
   */
  private async tryIPData(ipAddress: string): Promise<CompanyData | null> {
    try {
      const apiKey = process.env.IPDATA_API_KEY;
      if (!apiKey) {
        return null;
      }

      const response = await axios.get(
        `https://api.ipdata.co/${ipAddress}?api-key=${apiKey}`
      );

      if (response.data && response.data.asn) {
        return {
          name: response.data.asn.name,
          domain: response.data.asn.domain,
          country: response.data.country_name,
          city: response.data.city,
          location: `${response.data.city}, ${response.data.country_name}`,
        };
      }

      return null;
    } catch (error) {
      this.logger.debug(`IPData.co lookup failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Try IP-API.com (Free, no API key required)
   * https://ip-api.com/
   */
  private async tryIPAPI(ipAddress: string): Promise<CompanyData | null> {
    try {
      const response = await axios.get(
        `http://ip-api.com/json/${ipAddress}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`
      );

      if (response.data && response.data.status === 'success') {
        // For corporate IPs, the ISP/org often indicates the company
        const isLikelyBusiness =
          !response.data.isp?.toLowerCase().includes('residential') &&
          !response.data.isp?.toLowerCase().includes('mobile') &&
          response.data.org &&
          response.data.org !== response.data.isp;

        if (isLikelyBusiness) {
          return {
            name: response.data.org || response.data.isp,
            country: response.data.country,
            city: response.data.city,
            location: `${response.data.city}, ${response.data.country}`,
          };
        }
      }

      return null;
    } catch (error) {
      this.logger.debug(`IP-API.com lookup failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Try IPInfo.io
   * https://ipinfo.io/
   */
  private async tryIPInfo(ipAddress: string): Promise<CompanyData | null> {
    try {
      const apiKey = process.env.IPINFO_API_KEY;
      const url = apiKey
        ? `https://ipinfo.io/${ipAddress}?token=${apiKey}`
        : `https://ipinfo.io/${ipAddress}`;

      const response = await axios.get(url);

      if (response.data && response.data.org) {
        return {
          name: response.data.org.replace(/^AS\d+\s+/, ''), // Remove AS number prefix
          country: response.data.country,
          city: response.data.city,
          location: response.data.city
            ? `${response.data.city}, ${response.data.country}`
            : response.data.country,
        };
      }

      return null;
    } catch (error) {
      this.logger.debug(`IPInfo.io lookup failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Enrich company data with additional information from Clearbit
   */
  async enrichCompanyData(domain: string): Promise<CompanyData | null> {
    try {
      const apiKey = process.env.CLEARBIT_API_KEY;
      if (!apiKey) {
        return null;
      }

      this.logger.log(`🔍 Enriching company data for domain: ${domain}`);

      const response = await axios.get(
        `https://company.clearbit.com/v2/companies/find?domain=${domain}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      if (response.data) {
        const data = response.data;
        return {
          domain: data.domain,
          name: data.name,
          industry: data.category?.industry,
          size: this.formatCompanySize(data.metrics?.employees),
          location: data.location,
          country: data.geo?.country,
          city: data.geo?.city,
          revenue: data.metrics?.estimatedAnnualRevenue
            ? this.formatRevenue(data.metrics.estimatedAnnualRevenue)
            : undefined,
          linkedin: data.linkedin?.handle
            ? `https://linkedin.com/company/${data.linkedin.handle}`
            : undefined,
          twitter: data.twitter?.handle
            ? `https://twitter.com/${data.twitter.handle}`
            : undefined,
          facebook: data.facebook?.handle
            ? `https://facebook.com/${data.facebook.handle}`
            : undefined,
          description: data.description,
          logo: data.logo,
          employees: data.metrics?.employees,
          founded: data.foundedYear?.toString(),
          technologies: data.tech || [],
        };
      }

      return null;
    } catch (error) {
      this.logger.debug(`Clearbit enrichment failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Store or update company in database
   */
  async upsertCompany(companyData: CompanyData): Promise<any> {
    try {
      if (!companyData.domain && !companyData.name) {
        return null;
      }

      // Try to find existing company by domain or name
      let company = null;

      if (companyData.domain) {
        company = await this.prisma.company.findUnique({
          where: { domain: companyData.domain },
        });
      }

      if (company) {
        // Update existing company
        return await this.prisma.company.update({
          where: { id: company.id },
          data: {
            name: companyData.name || company.name,
            legalName: companyData.legalName || company.legalName,
            domainAliases: companyData.domainAliases
              ? JSON.stringify(companyData.domainAliases)
              : company.domainAliases,
            industry: companyData.industry || company.industry,
            sector: companyData.sector || company.sector,
            industryGroup: companyData.industryGroup || company.industryGroup,
            subIndustry: companyData.subIndustry || company.subIndustry,
            size: companyData.size || company.size,
            location: companyData.location || company.location,
            country: companyData.country || company.country,
            city: companyData.city || company.city,
            streetAddress: companyData.streetAddress || company.streetAddress,
            postalCode: companyData.postalCode || company.postalCode,
            state: companyData.state || company.state,
            stateCode: companyData.stateCode || company.stateCode,
            countryCode: companyData.countryCode || company.countryCode,
            lat: companyData.lat || company.lat,
            lng: companyData.lng || company.lng,
            revenue: companyData.revenue || company.revenue,
            linkedin: companyData.linkedin || company.linkedin,
            twitter: companyData.twitter || company.twitter,
            facebook: companyData.facebook || company.facebook,
            crunchbase: companyData.crunchbase || company.crunchbase,
            description: companyData.description || company.description,
            logo: companyData.logo || company.logo,
            employees: companyData.employees || company.employees,
            founded: companyData.founded || company.founded,
            foundedYear: companyData.foundedYear || company.foundedYear,
            technologies: companyData.technologies
              ? JSON.stringify(companyData.technologies)
              : company.technologies,
            tags: companyData.tags
              ? JSON.stringify(companyData.tags)
              : company.tags,
            timeZone: companyData.timeZone || company.timeZone,
            utcOffset: companyData.utcOffset || company.utcOffset,
            type: companyData.type || company.type,
            duns: companyData.duns || company.duns,
            ein: companyData.ein || company.ein,
            alexaGlobalRank:
              companyData.alexaGlobalRank || company.alexaGlobalRank,
            trafficRank: companyData.trafficRank || company.trafficRank,
            raised: companyData.raised || company.raised,
            parent: companyData.parent
              ? JSON.stringify(companyData.parent)
              : company.parent,
            ultimateParent: companyData.ultimateParent
              ? JSON.stringify(companyData.ultimateParent)
              : company.ultimateParent,
            phoneNumbers: companyData.phoneNumbers
              ? JSON.stringify(companyData.phoneNumbers)
              : company.phoneNumbers,
            emailAddresses: companyData.emailAddresses
              ? JSON.stringify(companyData.emailAddresses)
              : company.emailAddresses,
          },
        });
      } else {
        // Create new company
        return await this.prisma.company.create({
          data: {
            domain: companyData.domain,
            name: companyData.name,
            legalName: companyData.legalName,
            domainAliases: companyData.domainAliases
              ? JSON.stringify(companyData.domainAliases)
              : null,
            industry: companyData.industry,
            sector: companyData.sector,
            industryGroup: companyData.industryGroup,
            subIndustry: companyData.subIndustry,
            size: companyData.size,
            location: companyData.location,
            country: companyData.country,
            city: companyData.city,
            streetAddress: companyData.streetAddress,
            postalCode: companyData.postalCode,
            state: companyData.state,
            stateCode: companyData.stateCode,
            countryCode: companyData.countryCode,
            lat: companyData.lat,
            lng: companyData.lng,
            revenue: companyData.revenue,
            linkedin: companyData.linkedin,
            twitter: companyData.twitter,
            facebook: companyData.facebook,
            crunchbase: companyData.crunchbase,
            description: companyData.description,
            logo: companyData.logo,
            employees: companyData.employees,
            founded: companyData.founded,
            foundedYear: companyData.foundedYear,
            technologies: companyData.technologies
              ? JSON.stringify(companyData.technologies)
              : null,
            tags: companyData.tags ? JSON.stringify(companyData.tags) : null,
            timeZone: companyData.timeZone,
            utcOffset: companyData.utcOffset,
            type: companyData.type,
            duns: companyData.duns,
            ein: companyData.ein,
            alexaGlobalRank: companyData.alexaGlobalRank,
            trafficRank: companyData.trafficRank,
            raised: companyData.raised,
            parent: companyData.parent
              ? JSON.stringify(companyData.parent)
              : null,
            ultimateParent: companyData.ultimateParent
              ? JSON.stringify(companyData.ultimateParent)
              : null,
            phoneNumbers: companyData.phoneNumbers
              ? JSON.stringify(companyData.phoneNumbers)
              : null,
            emailAddresses: companyData.emailAddresses
              ? JSON.stringify(companyData.emailAddresses)
              : null,
          },
        });
      }
    } catch (error) {
      this.logger.error(`Error upserting company: ${error.message}`);
      return null;
    }
  }

  /**
   * Format company size
   */
  private formatCompanySize(employees: number | undefined): string | undefined {
    if (!employees) return undefined;

    if (employees <= 10) return '1-10';
    if (employees <= 50) return '11-50';
    if (employees <= 200) return '51-200';
    if (employees <= 500) return '201-500';
    if (employees <= 1000) return '501-1000';
    if (employees <= 5000) return '1001-5000';
    if (employees <= 10000) return '5001-10000';
    return '10000+';
  }

  /**
   * Format revenue
   */
  private formatRevenue(revenue: number): string {
    if (revenue >= 1000000000) {
      return `$${(revenue / 1000000000).toFixed(1)}B`;
    }
    if (revenue >= 1000000) {
      return `$${(revenue / 1000000).toFixed(1)}M`;
    }
    if (revenue >= 1000) {
      return `$${(revenue / 1000).toFixed(1)}K`;
    }
    return `$${revenue}`;
  }
}
