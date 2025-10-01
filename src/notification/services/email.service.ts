import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly sendGridApiKey: string;
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    this.sendGridApiKey = this.configService.get<string>('SENDGRID_API_KEY');
    this.fromEmail =
      this.configService.get<string>('FROM_EMAIL') || 'noreply@blurleads.com';

    // Configure SendGrid if API key is provided
    if (this.sendGridApiKey) {
      sgMail.setApiKey(this.sendGridApiKey);
    }

    // Fallback to SMTP if SendGrid is not configured
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com',
      port: parseInt(this.configService.get<string>('SMTP_PORT') || '587'),
      secure: false,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendNewLeadNotification(lead: any): Promise<void> {
    console.log('📧 Sending new lead email notification');

    try {
      const { client, user } = lead;
      const leadName =
        `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unknown';

      const subject = `🎯 New Lead Detected: ${leadName} from ${lead.company || 'Unknown Company'}`;

      const html = this.generateLeadEmailTemplate(lead);

      if (this.sendGridApiKey) {
        await this.sendWithSendGrid(user.email, subject, html);
      } else {
        await this.sendWithSMTP(user.email, subject, html);
      }

      console.log('✅ New lead email sent to:', user.email);
    } catch (error) {
      console.error('❌ Failed to send new lead email:', error);
    }
  }

  async sendEnrichmentCompleteNotification(visitor: any): Promise<void> {
    console.log('📧 Sending enrichment complete email notification');

    try {
      const { client, user } = visitor;

      const subject = `✅ Visitor Enrichment Complete`;
      const html = this.generateEnrichmentEmailTemplate(visitor);

      if (this.sendGridApiKey) {
        await this.sendWithSendGrid(user.email, subject, html);
      } else {
        await this.sendWithSMTP(user.email, subject, html);
      }

      console.log('✅ Enrichment complete email sent to:', user.email);
    } catch (error) {
      console.error('❌ Failed to send enrichment complete email:', error);
    }
  }

  private async sendWithSendGrid(
    to: string,
    subject: string,
    html: string
  ): Promise<void> {
    const msg = {
      to,
      from: this.fromEmail,
      subject,
      html,
    };

    await sgMail.send(msg);
  }

  private async sendWithSMTP(
    to: string,
    subject: string,
    html: string
  ): Promise<void> {
    const mailOptions = {
      from: this.fromEmail,
      to,
      subject,
      html,
    };

    await this.transporter.sendMail(mailOptions);
  }

  private generateLeadEmailTemplate(lead: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Lead Detected</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
          .lead-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .score { display: inline-block; background: #10B981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
          .info-row { margin: 10px 0; }
          .label { font-weight: bold; color: #6B7280; }
          .value { color: #111827; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 New Lead Detected!</h1>
            <p>A new high-value lead has been identified on your website.</p>
          </div>
          <div class="content">
            <div class="lead-card">
              <h2>${lead.firstName || ''} ${lead.lastName || ''}</h2>
              <div class="info-row">
                <span class="label">Company:</span>
                <span class="value">${lead.company || 'Not specified'}</span>
              </div>
              <div class="info-row">
                <span class="label">Title:</span>
                <span class="value">${lead.title || 'Not specified'}</span>
              </div>
              <div class="info-row">
                <span class="label">Email:</span>
                <span class="value">${lead.email || 'Not available'}</span>
              </div>
              <div class="info-row">
                <span class="label">Phone:</span>
                <span class="value">${lead.phone || 'Not available'}</span>
              </div>
              <div class="info-row">
                <span class="label">Location:</span>
                <span class="value">${lead.location || 'Not specified'}</span>
              </div>
              <div class="info-row">
                <span class="label">Industry:</span>
                <span class="value">${lead.industry || 'Not specified'}</span>
              </div>
              <div class="info-row">
                <span class="label">Lead Score:</span>
                <span class="score">${lead.score}/100</span>
              </div>
              ${
                lead.linkedinUrl
                  ? `
                <div class="info-row">
                  <span class="label">LinkedIn:</span>
                  <span class="value"><a href="${lead.linkedinUrl}" target="_blank">View Profile</a></span>
                </div>
              `
                  : ''
              }
              ${
                lead.website
                  ? `
                <div class="info-row">
                  <span class="label">Website:</span>
                  <span class="value"><a href="${lead.website}" target="_blank">${lead.website}</a></span>
                </div>
              `
                  : ''
              }
            </div>
            <p style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/leads"
                 style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View in Dashboard
              </a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateEnrichmentEmailTemplate(visitor: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Enrichment Complete</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10B981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Visitor Enrichment Complete</h1>
            <p>We've finished analyzing the visitor data from your website.</p>
          </div>
          <div class="content">
            <p><strong>Visitor Details:</strong></p>
            <ul>
              <li><strong>IP Address:</strong> ${visitor.ipAddress}</li>
              <li><strong>Page Visited:</strong> ${visitor.pageUrl}</li>
              <li><strong>Timestamp:</strong> ${new Date(visitor.timestamp).toLocaleString()}</li>
            </ul>
            <p>Check your dashboard for any leads that were created from this visitor.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
