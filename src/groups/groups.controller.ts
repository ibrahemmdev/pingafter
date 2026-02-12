import { Controller, Post, Get, Patch, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GroupsService } from './groups.service';
import { CreateGroupDto, UpdateGroupDto } from './dto/group.dto';

@Controller('groups')
@UseGuards(AuthGuard('jwt'))
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  create(@Request() req, @Body() dto: CreateGroupDto) {
    return this.groupsService.createGroup(req.user.userId, dto.name, dto.contacts);
  }

  @Get()
  findAll(@Request() req) {
    return this.groupsService.getUserGroups(req.user.userId);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateGroupDto) {
    return this.groupsService.updateGroup(req.user.userId, id, dto.name, dto.contacts);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.groupsService.deleteGroup(req.user.userId, id);
  }
}