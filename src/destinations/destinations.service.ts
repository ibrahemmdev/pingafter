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
    if (!group) throw new BadRequestException('Invalid group');

    const dest = this.destRepo.create({
      ...dto,
      userId,
      status: dto.status as unknown as DestinationStatus,
    });

    if (dest.status === DestinationStatus.ACTIVE) {
      if (!dto.deadline) throw new BadRequestException('Deadline required');
      dest.startTime = new Date();
    } else if (dest.status === DestinationStatus.SCHEDULED) {
      if (!dto.scheduledStartTime) throw new BadRequestException('Schedule time required');
    }

    return this.destRepo.save(dest);
  }

  async findActive(userId: string) {
    return this.destRepo.findOne({
      where: { userId, status: DestinationStatus.ACTIVE },
      relations: ['group']
    });
  }

  async stop(userId: string, id: string) {
    const dest = await this.destRepo.findOne({ where: { id, userId, status: DestinationStatus.ACTIVE } });
    if (!dest) throw new NotFoundException('No active destination');

    dest.status = DestinationStatus.COMPLETED;
    return this.destRepo.save(dest);
  }

  async snooze(userId: string, id: string) {
    const dest = await this.destRepo.findOne({ where: { id, userId, status: DestinationStatus.ACTIVE } });
    if (!dest || !dest.deadline) throw new BadRequestException('No active destination with deadline');

    dest.deadline = new Date(new Date(dest.deadline).getTime() + 60 * 60 * 1000);
    dest.preAlarmSent = false;
    return this.destRepo.save(dest);
  }

  async update(userId: string, id: string, dto: Partial<CreateDestinationDto>) {
    const dest = await this.destRepo.findOne({ where: { id, userId } });
    if (!dest) throw new NotFoundException();

    if (dest.status !== DestinationStatus.SAVED && dest.status !== DestinationStatus.SCHEDULED) {
      throw new ForbiddenException('Cannot edit active or finished destinations');
    }

    const updateData = { ...dto };
    if (dto.status) {
      (updateData as any).status = dto.status as unknown as DestinationStatus;
    }

    Object.assign(dest, updateData);
    return this.destRepo.save(dest);
  }

  async delete(userId: string, id: string) {
    const dest = await this.destRepo.findOne({ where: { id, userId } });
    if (!dest) throw new NotFoundException();

    if (dest.status !== DestinationStatus.SAVED) {
      throw new BadRequestException('Only saved destinations can be deleted');
    }

    return this.destRepo.remove(dest);
  }

  async findAll(userId: string) {
    return this.destRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }
}