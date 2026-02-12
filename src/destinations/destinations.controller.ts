import { 
  Controller, 
  Post, 
  Get, 
  Patch, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Request, 
  UseGuards 
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DestinationsService } from './destinations.service';
import { CreateDestinationDto } from './dto/create-destination.dto';

@Controller('destinations')
@UseGuards(AuthGuard('jwt'))
export class DestinationsController {
  constructor(private readonly destService: DestinationsService) {}

  @Post()
  async create(@Request() req, @Body() dto: CreateDestinationDto) {
    return this.destService.create(req.user.userId, dto);
  }

  @Get()
  async findAll(@Request() req) {
    return this.destService.findAll(req.user.userId);
  }

  @Get('active')
  async getActive(@Request() req) {
    return this.destService.findActive(req.user.userId);
  }

  @Post(':id/stop')
  async stop(@Request() req, @Param('id') id: string) {
    return this.destService.stop(req.user.userId, id);
  }

  @Post(':id/snooze')
  async snooze(@Request() req, @Param('id') id: string) {
    return this.destService.snooze(req.user.userId, id);
  }

  @Put(':id')
  async update(
    @Request() req, 
    @Param('id') id: string, 
    @Body() dto: Partial<CreateDestinationDto>
  ) {
    return this.destService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    return this.destService.delete(req.user.userId, id);
  }
}