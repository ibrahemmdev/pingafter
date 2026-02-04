import { Injectable, ConflictException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SignUpDto } from './dto/signup.dto';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { MailService } from './../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
    private configService: ConfigService,
  ) {}

  async signUp(signUpDto: SignUpDto) {
    const { email, password, username, displayName } = signUpDto;

    if (await this.usersService.findOneByEmail(email)) throw new ConflictException('Email already exists');
    if (await this.usersService.findOneByUsername(username)) throw new ConflictException('Username already exists');

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.usersService.create({
      email,
      username,
      displayName,
      password: hashedPassword,
      isEmailVerified: false,
    });

    await this.generateAndSendVerification(user);

    return { message: 'Registration successful. Please check your email.' };
  }

  async validateUser(identifier: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmailOrUsername(identifier);
    if (user && user.password) {
      const isMatch = await bcrypt.compare(pass, user.password);
      if (isMatch) {
        if (!user.isEmailVerified) throw new UnauthorizedException('Email not verified');
        const { password, ...result } = user;
        return result;
      }
    }
    return null;  
  }

  login(user: any) {
    const payload = { email: user.email, sub: user.id, username: user.username };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        picture: user.picture
      }
    };
  }

  async googleLogin(req) {
    if (!req.user) throw new BadRequestException('No user from google');
    
    const { email, firstName, lastName, picture, accessToken } = req.user;
    let user = await this.usersService.findOneByEmail(email);

    if (!user) {
      const uniqueSuffix = Date.now().toString().slice(-4);
      const generatedUsername = `${email.split('@')[0]}_${uniqueSuffix}`;

      const hashedPassword = await bcrypt.hash(Date.now().toString(), 10);

      user = await this.usersService.create({
        email,
        displayName: `${firstName} ${lastName ?? ""}`,
        username: generatedUsername,
        password: hashedPassword,
        picture,
        googleId: accessToken,
        isEmailVerified: true,
      });
    }

    return this.login(user);
  }

  async verifyEmail(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_VERIFICATION_SECRET'),
      });

      const userId = payload.sub;
      const tokenUuid = payload.jti;

      const user = await this.usersService.findById(userId);
      if (!user) throw new BadRequestException('User not found');
      if (user.isEmailVerified) throw new BadRequestException('Email already verified');

      if (user.verificationId !== tokenUuid) {
        throw new BadRequestException('Invalid verification link');
      }

      if (user.verificationExpires && new Date() > user.verificationExpires) {
        throw new BadRequestException('Verification link expired');
      }

      await this.usersService.markEmailAsVerified(userId);

      return { message: 'Email verified successfully. You can now login.' };

    } catch (error) {
      if (error?.name === 'TokenExpiredError') {
        throw new BadRequestException('Verification link expired. Please request a new one.');
      }
      throw new BadRequestException('Invalid token');
    }
  }
  
  private async generateAndSendVerification(user: any) {
    const verificationId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    await this.usersService.updateVerificationInfo(user.id, verificationId, expiresAt);

    const token = this.jwtService.sign(
      { sub: user.id, jti: verificationId },
      { 
        secret: this.configService.get('JWT_VERIFICATION_SECRET'),
        expiresIn: '15m'
      }
    );

    await this.mailService.sendVerificationEmail(user.email, token);
  }

  async resendVerificationEmail(email: string) {
    const user = await this.usersService.findOneByEmail(email);
    if (!user || user.isEmailVerified) return { message: 'If user exists and unverified, link sent.' };

    await this.generateAndSendVerification(user);
    return { message: 'Verification link sent.' };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) return { message: 'If email exists, reset link sent.' };

    const resetId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    await this.usersService.updateResetPasswordInfo(user.id, resetId, expiresAt);

    const token = this.jwtService.sign(
      { sub: user.id, jti: resetId },
      { 
        secret: this.configService.get('JWT_RESET_SECRET'),
        expiresIn: this.configService.get('JWT_RESET_EXPIRATION') 
      }
    );

    await this.mailService.sendResetPasswordEmail(user.email, token);

    return { message: 'Reset link sent.' };
  }

  async resetPassword(token: string, newPass: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_RESET_SECRET'),
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user) throw new BadRequestException('User not found');

      if (user.resetPasswordToken !== payload.jti) {
        throw new BadRequestException('Invalid or used reset link');
      }
      if (user.resetPasswordExpires && new Date() > user.resetPasswordExpires) {
        throw new BadRequestException('Reset link expired');
      }

      const hashedPassword = await bcrypt.hash(newPass, 10);
      await this.usersService.updatePassword(user.id, hashedPassword);

      return { message: 'Password has been reset successfully.' };

    } catch (error) {
      throw new BadRequestException('Invalid or expired reset token');
    }
  }

}