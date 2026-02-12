import { IsArray, IsEmail, IsOptional, IsString, Length, ArrayMaxSize } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @Length(2, 30)
  name: string;

  @IsArray()
  @ArrayMaxSize(20)
  @IsEmail({}, { each: true })
  contacts: string[];
}

export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  @Length(2, 30)
  name?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsEmail({}, { each: true })
  contacts?: string[];
}