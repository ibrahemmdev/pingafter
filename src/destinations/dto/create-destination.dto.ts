import { IsString, IsNumber, IsEnum, IsUUID, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { DestinationStatus } from '../entities/destination.entity';

export class CreateDestinationDto {
  @IsString() @IsNotEmpty()
  name: string;

  @IsString() @IsNotEmpty()
  address: string;

  @IsNumber() @IsNotEmpty()
  lat: number;

  @IsNumber() @IsNotEmpty()
  lng: number;

  @IsUUID() @IsNotEmpty()
  groupId: string;

  @IsOptional() @IsString()
  notes?: string;

  @IsOptional() @IsDateString()
  scheduledStartTime?: Date;

  @IsEnum(DestinationStatus)
  @IsNotEmpty()
  status: DestinationStatus;

  @IsOptional() @IsDateString()
  deadline?: Date;
}