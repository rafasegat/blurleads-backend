import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EmailService } from './services/email.service';
import { SlackService } from './services/slack.service';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly slackService: SlackService,
  ) {}

  async notifyNewLead(leadId: string): Promise<void> {
    console.log('📧 Sending new lead notification for:', leadId);

    try {
      const lead = await this.prisma.lead.findUnique({
        where: { id: leadId },
        include: {
          client: {
            include: { user: true },
          },
          visitor: true,
        },
      });

      if (!lead) {
        console.error('❌ Lead not found:', leadId);
        return;
      }

      // Send email notification
      await this.emailService.sendNewLeadNotification(lead);

      // Send Slack notification if configured
      await this.slackService.sendNewLeadNotification(lead);

      // Create notification record
      await this.prisma.notification.create({
        data: {
          type: 'NEW_LEAD',
          title: 'New Lead Detected',
          message: `New lead: ${lead.firstName} ${lead.lastName} from ${lead.company}`,
          data: {
            leadId: lead.id,
            leadName: `${lead.firstName} ${lead.lastName}`,
            company: lead.company,
            email: lead.email,
            score: lead.score,
          },
          clientId: lead.clientId,
          userId: lead.userId,
        },
      });

      console.log('✅ New lead notification sent for:', leadId);
    } catch (error) {
      console.error('❌ Failed to send new lead notification:', error);
    }
  }

  async notifyEnrichmentComplete(visitorId: string, leadId?: string): Promise<void> {
    console.log('📧 Sending enrichment complete notification for visitor:', visitorId);

    try {
      const visitor = await this.prisma.visitor.findUnique({
        where: { id: visitorId },
        include: {
          client: {
            include: { user: true },
          },
        },
      });

      if (!visitor) {
        console.error('❌ Visitor not found:', visitorId);
        return;
      }

      const message = leadId
        ? 'Visitor enrichment completed - Lead created'
        : 'Visitor enrichment completed - No lead data found';

      // Create notification record
      await this.prisma.notification.create({
        data: {
          type: 'ENRICHMENT_COMPLETE',
          title: 'Enrichment Complete',
          message,
          data: {
            visitorId: visitor.id,
            leadId,
            ipAddress: visitor.ipAddress,
            pageUrl: visitor.pageUrl,
          },
          clientId: visitor.clientId,
          userId: visitor.client.userId,
        },
      });

      console.log('✅ Enrichment complete notification sent for visitor:', visitorId);
    } catch (error) {
      console.error('❌ Failed to send enrichment complete notification:', error);
    }
  }

  async getNotifications(userId: string, clientId?: string): Promise<any[]> {
    console.log('📬 Getting notifications for user:', userId);

    const where: any = { userId };
    if (clientId) {
      where.clientId = clientId;
    }

    const notifications = await this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return notifications;
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    console.log('📬 Marking notification as read:', notificationId);

    await this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        isRead: true,
      },
    });

    console.log('✅ Notification marked as read:', notificationId);
  }
}
