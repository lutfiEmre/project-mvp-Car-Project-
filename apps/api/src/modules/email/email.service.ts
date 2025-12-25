import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly isEnabled: boolean;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    this.fromEmail = this.configService.get<string>('SENDGRID_FROM_EMAIL', 'noreply@drivingaway.ca');
    this.fromName = this.configService.get<string>('SENDGRID_FROM_NAME', 'DrivingAway');
    this.isEnabled = !!apiKey;

    if (apiKey) {
      sgMail.setApiKey(apiKey);
      this.logger.log('SendGrid email service initialized');
    } else {
      this.logger.warn('SendGrid API key not found. Email service disabled.');
    }
  }

  async sendEmail(to: string, subject: string, html: string, text?: string): Promise<void> {
    if (!this.isEnabled) {
      this.logger.warn(`Email sending disabled. Would send to: ${to}, Subject: ${subject}`);
      return;
    }

    try {
      const msg = {
        to,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject,
        text: text || this.stripHtml(html),
        html,
      };

      await sgMail.send(msg);
      this.logger.log(`Email sent successfully to: ${to}`);
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendPasswordReset(email: string, resetToken: string, resetUrl: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">DrivingAway</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
            <p>Hello,</p>
            <p>We received a request to reset your password. Click the button below to reset it:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              This link will expire in 1 hour. If you didn't request this, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} DrivingAway. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail(
      email,
      'Reset Your Password - DrivingAway',
      html,
    );
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to DrivingAway</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Welcome to DrivingAway!</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Hello ${firstName},</h2>
            <p>Thank you for joining DrivingAway - Canada's premier vehicle marketplace!</p>
            <p>Your account has been successfully created. You can now:</p>
            <ul>
              <li>Browse thousands of vehicles</li>
              <li>Save your favorite listings</li>
              <li>Contact dealers directly</li>
              <li>Create and manage your own listings</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.configService.get('FRONTEND_URL', 'https://drivingaway.ca')}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Get Started</a>
            </div>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} DrivingAway. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail(
      email,
      'Welcome to DrivingAway!',
      html,
    );
  }

  async sendListingApprovedEmail(email: string, firstName: string, listingTitle: string, listingUrl: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Listing Has Been Approved</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Listing Approved!</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Hello ${firstName},</h2>
            <p>Great news! Your listing <strong>"${listingTitle}"</strong> has been approved and is now live on DrivingAway.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${listingUrl}" style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Listing</a>
            </div>
            <p>Your listing is now visible to thousands of potential buyers. Good luck with your sale!</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} DrivingAway. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail(
      email,
      'Your Listing Has Been Approved - DrivingAway',
      html,
    );
  }

  async sendListingRejectedEmail(email: string, firstName: string, listingTitle: string, reason?: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Listing Review Update</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Listing Review Update</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Hello ${firstName},</h2>
            <p>We're sorry to inform you that your listing <strong>"${listingTitle}"</strong> could not be approved at this time.</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            <p>Please review your listing and make the necessary changes. You can resubmit it for review from your dashboard.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.configService.get('FRONTEND_URL', 'https://drivingaway.ca')}/dashboard/listings" style="background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View My Listings</a>
            </div>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} DrivingAway. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail(
      email,
      'Listing Review Update - DrivingAway',
      html,
    );
  }

  async sendTestEmail(to: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Test Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">DrivingAway</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Test Email</h2>
            <p>This is a test email from DrivingAway. If you're receiving this, your email configuration is working correctly!</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Sent at: ${new Date().toLocaleString()}
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} DrivingAway. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail(
      to,
      'Test Email - DrivingAway',
      html,
    );
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }
}

