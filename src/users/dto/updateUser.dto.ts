import { IsEmail, IsOptional, IsString, IsBoolean, IsNumber, Min, Length } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(2, 50)
  displayName?: string;

  @IsOptional()
  @IsEmail()
  heirEmail?: string;

  @IsOptional()
  @IsBoolean()
  deadSwitchEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  deadSwitchDurationHours?: number;
}