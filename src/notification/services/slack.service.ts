import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class SlackService {
  private readonly webhookUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.webhookUrl = this.configService.get<string>('SLACK_WEBHOOK_URL');
  }

  async sendNewLeadNotification(lead: any): Promise<void> {
    if (!this.webhookUrl) {
      console.log('⚠️ Slack webhook URL not configured');
      return;
    }

    try {
      console.log('📱 Sending Slack notification for new lead');

      const leadName = `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unknown';
      const company = lead.company || 'Unknown Company';
      const score = lead.score || 0;

      const message = {
        text: `🎯 New Lead Detected!`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🎯 New Lead Detected!',
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Name:*\n${leadName}`,
              },
              {
                type: 'mrkdwn',
                text: `*Company:*\n${company}`,
              },
              {
                type: 'mrkdwn',
                text: `*Title:*\n${lead.title || 'Not specified'}`,
              },
              {
                type: 'mrkdwn',
                text: `*Email:*\n${lead.email || 'Not available'}`,
              },
              {
                type: 'mrkdwn',
                text: `*Phone:*\n${lead.phone || 'Not available'}`,
              },
              {
                type: 'mrkdwn',
                text: `*Lead Score:*\n${score}/100`,
              },
            ],
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'View in Dashboard',
                },
                url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/leads`,
                style: 'primary',
              },
            ],
          },
        ],
      };

      await axios.post(this.webhookUrl, message);
      console.log('✅ Slack notification sent for new lead');
    } catch (error) {
      console.error('❌ Failed to send Slack notification:', error);
    }
  }

  async sendEnrichmentCompleteNotification(visitor: any): Promise<void> {
    if (!this.webhookUrl) {
      console.log('⚠️ Slack webhook URL not configured');
      return;
    }

    try {
      console.log('📱 Sending Slack notification for enrichment complete');

      const message = {
        text: `✅ Visitor Enrichment Complete`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '✅ Visitor Enrichment Complete',
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*IP Address:*\n${visitor.ipAddress}`,
              },
              {
                type: 'mrkdwn',
                text: `*Page Visited:*\n${visitor.pageUrl}`,
              },
              {
                type: 'mrkdwn',
                text: `*Timestamp:*\n${new Date(visitor.timestamp).toLocaleString()}`,
              },
            ],
          },
        ],
      };

      await axios.post(this.webhookUrl, message);
      console.log('✅ Slack notification sent for enrichment complete');
    } catch (error) {
      console.error('❌ Failed to send Slack notification:', error);
    }
  }
}
