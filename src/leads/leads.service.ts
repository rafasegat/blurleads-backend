import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async getLeads(userId: string, clientId?: string, page = 1, limit = 20): Promise<any> {
    console.log('📋 Getting leads for user:', userId);

    const where: any = { userId };
    if (clientId) {
      where.clientId = clientId;
    }

    const [leads, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        include: {
          client: true,
          visitor: true,
          enrichments: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      leads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getLeadById(id: string, userId: string): Promise<any> {
    console.log('📋 Getting lead by ID:', id);

    const lead = await this.prisma.lead.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        client: true,
        visitor: true,
        enrichments: true,
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    return lead;
  }

  async updateLeadStatus(id: string, status: string, userId: string): Promise<any> {
    console.log('📋 Updating lead status:', id, 'to', status);

    const lead = await this.prisma.lead.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    const updatedLead = await this.prisma.lead.update({
      where: { id },
      data: { status: status as any },
    });

    console.log('✅ Lead status updated:', id);
    return updatedLead;
  }

  async getLeadStats(userId: string, clientId?: string): Promise<any> {
    console.log('📊 Getting lead stats for user:', userId);

    const where: any = { userId };
    if (clientId) {
      where.clientId = clientId;
    }

    const [
      totalLeads,
      newLeads,
      contactedLeads,
      qualifiedLeads,
      convertedLeads,
      lostLeads,
      avgScore,
    ] = await Promise.all([
      this.prisma.lead.count({ where }),
      this.prisma.lead.count({ where: { ...where, status: 'NEW' } }),
      this.prisma.lead.count({ where: { ...where, status: 'CONTACTED' } }),
      this.prisma.lead.count({ where: { ...where, status: 'QUALIFIED' } }),
      this.prisma.lead.count({ where: { ...where, status: 'CONVERTED' } }),
      this.prisma.lead.count({ where: { ...where, status: 'LOST' } }),
      this.prisma.lead.aggregate({
        where,
        _avg: { score: true },
      }),
    ]);

    return {
      totalLeads,
      newLeads,
      contactedLeads,
      qualifiedLeads,
      convertedLeads,
      lostLeads,
      avgScore: avgScore._avg.score || 0,
      conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
    };
  }

  async searchLeads(
    userId: string,
    query: string,
    clientId?: string,
    page = 1,
    limit = 20,
  ): Promise<any> {
    console.log('🔍 Searching leads with query:', query);

    const where: any = {
      userId,
      OR: [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { company: { contains: query, mode: 'insensitive' } },
        { title: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (clientId) {
      where.clientId = clientId;
    }

    const [leads, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        include: {
          client: true,
          visitor: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      leads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
