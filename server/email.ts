import nodemailer from "nodemailer";
import { User } from "@shared/schema";

export class EmailService {
  private transporter: nodemailer.Transporter;
  private from: string;

  constructor() {
    // Check if we have email server configuration
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    
    if (!smtpHost || !smtpUser || !smtpPass) {
      console.log("Email service not fully configured");
    }
    
    this.from = process.env.EMAIL_FROM || "GateHub <noreply@gatehub.com>";
    
    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  // Send invitation email to a new user
  async sendInvitation(email: string, inviteLink: string, invitedBy: User): Promise<boolean> {
    try {
      const message = {
        from: this.from,
        to: email,
        subject: "Invitation to GateHub",
        text: `You have been invited to join GateHub by ${invitedBy.firstName} ${invitedBy.lastName}. Use this link to set up your account: ${inviteLink}`,
        html: this.generateInvitationHtml(inviteLink, invitedBy),
      };
      
      await this.transporter.sendMail(message);
      return true;
    } catch (error) {
      console.error("Failed to send invitation email:", error);
      return false;
    }
  }

  // Send bulk invitations to multiple users
  async sendBulkInvitations(emails: string[], baseInviteLink: string, invitedBy: User): Promise<{ success: string[]; failed: string[] }> {
    const results = { success: [] as string[], failed: [] as string[] };
    
    for (const email of emails) {
      // Create a unique invitation link for each user
      const inviteLink = `${baseInviteLink}?email=${encodeURIComponent(email)}`;
      const success = await this.sendInvitation(email, inviteLink, invitedBy);
      
      if (success) {
        results.success.push(email);
      } else {
        results.failed.push(email);
      }
    }
    
    return results;
  }

  // Send notification about request status
  async sendRequestStatusNotification(user: User, requestName: string, status: string): Promise<boolean> {
    try {
      const message = {
        from: this.from,
        to: user.email,
        subject: `Request Update: ${requestName}`,
        text: `Your request for "${requestName}" has been ${status}.`,
        html: this.generateStatusNotificationHtml(user, requestName, status),
      };
      
      await this.transporter.sendMail(message);
      return true;
    } catch (error) {
      console.error("Failed to send status notification email:", error);
      return false;
    }
  }

  // HTML templates for emails
  private generateInvitationHtml(inviteLink: string, invitedBy: User): string {
    return `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e5ea; border-radius: 5px;">
        <div style="background-color: #0078D4; padding: 15px; border-radius: 5px 5px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">GateHub</h1>
        </div>
        <div style="padding: 20px; background-color: #f8f9fa; border-radius: 0 0 5px 5px;">
          <p style="font-size: 16px; color: #1F2937; margin-bottom: 20px;">
            You have been invited to join GateHub by ${invitedBy.firstName} ${invitedBy.lastName}.
          </p>
          <p style="font-size: 16px; color: #1F2937; margin-bottom: 30px;">
            Use the button below to set up your account and get started.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" style="background-color: #0078D4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          <p style="font-size: 14px; color: #6B7280; margin-top: 30px;">
            If the button doesn't work, copy and paste this link into your browser: ${inviteLink}
          </p>
        </div>
        <div style="padding: 15px; text-align: center; color: #6B7280; font-size: 12px;">
          &copy; ${new Date().getFullYear()} GateHub. All rights reserved.
        </div>
      </div>
    `;
  }

  private generateStatusNotificationHtml(user: User, requestName: string, status: string): string {
    const statusColor = status === 'approved' ? '#10B981' : status === 'rejected' ? '#EF4444' : '#F59E0B';
    
    return `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e5ea; border-radius: 5px;">
        <div style="background-color: #0078D4; padding: 15px; border-radius: 5px 5px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">GateHub</h1>
        </div>
        <div style="padding: 20px; background-color: #f8f9fa; border-radius: 0 0 5px 5px;">
          <p style="font-size: 16px; color: #1F2937; margin-bottom: 20px;">
            Hello ${user.firstName},
          </p>
          <p style="font-size: 16px; color: #1F2937; margin-bottom: 20px;">
            Your request for "${requestName}" has been <span style="color: ${statusColor}; font-weight: bold;">${status}</span>.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.APP_URL || 'http://localhost:5000'}/requests" style="background-color: #0078D4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
              View Request Details
            </a>
          </div>
        </div>
        <div style="padding: 15px; text-align: center; color: #6B7280; font-size: 12px;">
          &copy; ${new Date().getFullYear()} GateHub. All rights reserved.
        </div>
      </div>
    `;
  }
}

export const emailService = new EmailService();
