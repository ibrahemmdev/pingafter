import { Injectable, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  handleRequest(err, user, info): any {
    if (err || !user) {
      throw new BadRequestException({
        message: 'Google Login Failed',
        error: 'Session expired or invalid. Please try again.',
      });
    }
    return user;
  }
}