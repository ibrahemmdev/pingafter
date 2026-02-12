import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './entities/group.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group) private groupsRepository: Repository<Group>,
    @InjectRepository(User) private usersRepository: Repository<User>,
  ) {}

  async createGroup(userId: string, name: string, contacts: string[]) {
    const groupCount = await this.groupsRepository.count({ where: { userId } });
    if (groupCount >= 10) {
      throw new BadRequestException('You have reached the maximum limit of 10 groups.');
    }

    if (contacts.length > 20) {
      throw new BadRequestException('A group cannot exceed 20 contacts.');
    }

    this.validateEmails(contacts);

    const group = this.groupsRepository.create({ name, contacts, userId });
    return this.groupsRepository.save(group);
  }

  async updateGroup(userId: string, groupId: string, name?: string, contacts?: string[]) {
    const group = await this.groupsRepository.findOne({ where: { id: groupId, userId } });
    if (!group) throw new NotFoundException('Group not found.');

    if (contacts) {
      if (contacts.length > 20) throw new BadRequestException('Group cannot exceed 20 contacts.');
      this.validateEmails(contacts);
      group.contacts = contacts;
    }

    if (name) group.name = name;
    return this.groupsRepository.save(group);
  }

  async deleteGroup(userId: string, groupId: string) {
    const group = await this.groupsRepository.findOne({ where: { id: groupId, userId } });
    if (!group) throw new NotFoundException('Group not found.');

    return this.groupsRepository.remove(group);
  }

  async getUserGroups(userId: string) {
    return this.groupsRepository.find({ where: { userId } });
  }

  private validateEmails(emails: string[]) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalid = emails.filter(e => !emailRegex.test(e));
    if (invalid.length > 0) {
      throw new BadRequestException(`Invalid email formats: ${invalid.join(', ')}`);
    }
  }
}