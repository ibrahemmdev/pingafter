import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
  ) {}

  async findOneByEmail(email: string): Promise<User | undefined | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findOneByUsername(username: string): Promise<User | undefined | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async findByEmailOrUsername(identifier: string): Promise<User | undefined | null> {
    return this.usersRepository.findOne({
      where: [
        { email: identifier },
        { username: identifier }
      ],
      select: ['id', 'email', 'username', 'displayName', 'password', 'picture', 'googleId']
    });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }

  async updateVerificationInfo(userId: string, verificationId: string, expires: Date) {
    await this.usersRepository.update(userId, { 
      verificationId,
      verificationExpires: expires 
    });
  }

  async markEmailAsVerified(userId: string) {
    await this.usersRepository.update(userId, {
      isEmailVerified: true,
      verificationId: null!,
      verificationExpires: null!, 
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async updateResetPasswordInfo(userId: string, resetId: string, expires: Date) {
    await this.usersRepository.update(userId, {
      resetPasswordToken: resetId,
      resetPasswordExpires: expires,
    });
  }

  async updatePassword(userId: string, hashedPassword: string) {
    await this.usersRepository.update(userId, {
      password: hashedPassword,
      resetPasswordToken: null!,     
      resetPasswordExpires: null!, 
    });
  }
}