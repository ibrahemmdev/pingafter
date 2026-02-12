import { IsString, IsOptional, IsNumber, IsEnum, IsUUID, Min, Max } from 'class-validator';

export class CreateDestinationDto {
  @IsString()
  name: string;

  @IsOptional() @IsString()
  address?: string;

  @IsOptional() @IsNumber()
  lat?: number;

  @IsOptional() @IsNumber()
  lng?: number;

  @IsUUID()
  groupId: string;

  @IsOptional() @IsString()
  notes?: string;

  @IsNumber()
  @Min(0.1) @Max(168)
  timerHours: number;

  @IsEnum(['startNow', 'startLater', 'save'])
  action: 'startNow' | 'startLater' | 'save';

  @IsOptional()
  scheduledStartTime?: Date;
}