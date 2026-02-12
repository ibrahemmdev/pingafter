import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column()
  displayName: string;

  @Column({ nullable: false, select: false }) 
  password: string;

  @Column({ nullable: true })
  googleId?: string;

  @Column({ nullable: true })
  picture?: string;

  @Column({ nullable: true })
  heirEmail?: string

  @Column({ default: false })
  deadSwitchEnabled?: boolean;

  @Column({ type: 'int', nullable: true })
  deadSwitchDurationHours?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  resetPasswordToken?: string;

  @Column({ nullable: true })
  resetPasswordExpires?: Date;

  @Column({ default: false })
  isEmailVerified: boolean;
  
  @Column({ nullable: true })
  verificationId?: string;

  @Column({ type: 'timestamp', nullable: true })
  verificationExpires?: Date;
}