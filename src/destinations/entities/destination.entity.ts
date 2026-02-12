import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './../../users/entities/user.entity';
import { Group } from './../../groups/entities/group.entity';

export enum DestinationStatus {
  SAVED = 'saved',
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ALARM_SENT = 'alarm_sent',
}

@Entity('destinations')
export class Destination {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  lat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  lng: number;

  @ManyToOne(() => Group, { nullable: false, onDelete: 'RESTRICT' })
  group: Group;

  @Column()
  groupId: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'timestamp', nullable: true })
  scheduledStartTime?: Date;

  @Column({ type: 'timestamp', nullable: true })
  startTime?: Date;

  @Column({ type: 'timestamp', nullable: true })
  deadline?: Date;

  @Column({
    type: 'enum',
    enum: DestinationStatus,
    default: DestinationStatus.SAVED,
  })
  status: DestinationStatus;

  @Column({ default: false })
  preAlarmSent: boolean;

  @Column({ default: false })
  alarmProcessed: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}