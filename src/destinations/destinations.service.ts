import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Destination, DestinationStatus } from './entities/destination.entity';
import { Group } from '../groups/entities/group.entity';
import { CreateDestinationDto } from './dto/create-destination.dto';

@Injectable()
export class DestinationsService {
  constructor(
    @InjectRepository(Destination) private destRepo: Repository<Destination>,
    @InjectRepository(Group) private groupRepo: Repository<Group>,
  ) {}

  async create(userId: string, dto: CreateDestinationDto) {
    const group = await this.groupRepo.findOne({ where: { id: dto.groupId, userId } });
    if (!group) throw new BadRequestException('Invalid emergency group.');

    const dest = this.destRepo.create({
      ...dto,
      userId,
      status: DestinationStatus.SAVED,
    });

    if (dto.action === 'startNow') {
      const now = new Date();
      dest.status = DestinationStatus.ACTIVE;
      dest.startTime = now;
      dest.deadline = new Date(now.getTime() + dto.timerHours * 60 * 60 * 1000);
    } else if (dto.action === 'startLater') {
      if (!dto.scheduledStartTime) throw new BadRequestException('Scheduled start time is required.');
      dest.status = DestinationStatus.SCHEDULED;
      dest.scheduledStartTime = dto.scheduledStartTime;
    }

    return this.destRepo.save(dest);
  }

  async getActive(userId: string) {
    return this.destRepo.findOne({
      where: { userId, status: DestinationStatus.ACTIVE },
      relations: ['group']
    });
  }

  async stop(userId: string, id: string) {
    const dest = await this.destRepo.findOne({ where: { id, userId } });
    if (!dest) throw new NotFoundException('Destination not found.');
    if (dest.status !== DestinationStatus.ACTIVE) throw new BadRequestException('Only active destinations can be stopped.');

    dest.status = DestinationStatus.COMPLETED;
    return this.destRepo.save(dest);
  }

  async snooze(userId: string, id: string) {
    const dest = await this.destRepo.findOne({ where: { id, userId } });
    if (!dest || dest.status !== DestinationStatus.ACTIVE) {
      throw new BadRequestException('No active destination to snooze.');
    }

    dest.deadline = new Date(dest.deadline!.getTime() + 60 * 60 * 1000);
    dest.preAlarmSent = false;
    return this.destRepo.save(dest);
  }

  async update(userId: string, id: string, dto: Partial<CreateDestinationDto>) {
    const dest = await this.destRepo.findOne({ where: { id, userId } });
    if (!dest) throw new NotFoundException('Destination not found.');
    
    if (![DestinationStatus.SAVED, DestinationStatus.SCHEDULED].includes(dest.status)) {
      throw new ForbiddenException('Cannot edit an active or finished destination.');
    }

    Object.assign(dest, dto);
    return this.destRepo.save(dest);
  }

  async delete(userId: string, id: string) {
    const dest = await this.destRepo.findOne({ where: { id, userId } });
    if (!dest) throw new NotFoundException('Destination not found.');
    
    if (dest.status !== DestinationStatus.SAVED) {
      throw new BadRequestException('Only saved destinations can be deleted.');
    }

    return this.destRepo.remove(dest);
  }

  async findAll(userId: string) {
    return this.destRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }
}