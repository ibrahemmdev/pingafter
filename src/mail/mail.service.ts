import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      secure: false,
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
    });
  }

  async sendResetPasswordEmail(to: string, token: string) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const resetLink = `${frontendUrl}/auth/reset-password?token=${token}`;
    
    await this.transporter.sendMail({
      from: `"Ping After" <${this.configService.get<string>('MAIL_FROM')}>`,
      to: to,
      subject: 'Password Reset Request',
      html: `
        <p>You requested a password reset</p>
        <p>Click this link to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link expires in 1 hour.</p>
      `,
    });
  }

  async sendVerificationEmail(to: string, token: string) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const verificationLink = `${frontendUrl}/auth/verify-email?token=${token}`;
    
    await this.transporter.sendMail({
      from: `"Ping After" <${this.configService.get<string>('MAIL_FROM')}>`,
      to: to,
      subject: 'Welcome! Confirm your Email',
      html: `
        <h1>Welcome to our App!</h1>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationLink}">Confirm Email</a>
      `,
    });
  }
}