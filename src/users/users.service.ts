import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { R2Service } from 'src/utils/r2.services';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    private readonly r2Service: R2Service,
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
    const defaultAvatar = `https://ui-avatars.com/api/?name=${userData.displayName}&background=0D8ABC&color=fff`;

    if (!userData.picture) {
      userData.picture = defaultAvatar;
    }
    
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

  async updateDisplayName(userId: string, displayName: string) {
    if (!displayName || displayName.trim().length < 2) {
      throw new Error('Display name is too short');
    }
    await this.usersRepository.update(userId, { displayName });
  }

  async updateProfile(userId: string, data: { 
    displayName?: string; 
    heirEmail?: string; 
    deadSwitchEnabled?: boolean; 
    deadSwitchDurationHours?: number; 
  }) {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (data.deadSwitchEnabled === true) {
      const finalHeirEmail = data.heirEmail || user.heirEmail;
      if (!finalHeirEmail) {
        throw new BadRequestException('Cannot enable Dead Switch without a heir email');
      }
    }

    await this.usersRepository.update(userId, data);
    return this.findById(userId);
  }

  async updateProfilePicture(userId: string, file: Express.Multer.File) {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (user.picture) {
      await this.r2Service.deleteFile(user.picture);
    }

    const uploadResult = await this.r2Service.uploadFile(file);

    await this.usersRepository.update(userId, { picture: uploadResult.url });

    return { url: uploadResult.url };
  }
}