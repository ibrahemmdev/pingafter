import { 
  Controller, Get, Patch, Body, UseGuards, Request, 
  UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator 
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/updateUser.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getProfile(@Request() req) {
    return this.usersService.findById(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('update-profile')
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.userId, updateProfileDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('update-picture')
  @UseInterceptors(FileInterceptor('file'))
  async updatePicture(
    @Request() req,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
        ],
      }),
    ) file: Express.Multer.File,
  ) {
    return this.usersService.updateProfilePicture(req.user.userId, file);
  }
}