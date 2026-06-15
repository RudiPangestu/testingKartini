import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AttendanceService } from './attendance.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SaveAttendanceDto } from './dto/save-attendance.dto';
import { QuerySessionDto } from './dto/query-session.dto';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CurrentUser,
  JwtUser,
} from '../common/decorators/current-user.decorator';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @Roles(Role.ADMIN, Role.GURU)
  @Post('sessions')
  createSession(@Body() dto: CreateSessionDto, @CurrentUser() user: JwtUser) {
    return this.service.createSession(dto, user);
  }

  @Roles(Role.ADMIN, Role.GURU)
  @Get('sessions')
  findSessions(@Query() query: QuerySessionDto) {
    return this.service.findSessions(query);
  }

  @Roles(Role.ADMIN, Role.GURU)
  @Get('sessions/:id')
  findSession(@Param('id') id: string) {
    return this.service.findSession(id);
  }

  @Roles(Role.ADMIN, Role.GURU)
  @Put('sessions/:id')
  saveAttendance(
    @Param('id') id: string,
    @Body() dto: SaveAttendanceDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.service.saveAttendance(id, dto, user.userId);
  }

  @Roles(Role.ADMIN, Role.GURU, Role.ORTU, Role.MURID)
  @Get('student/:studentId')
  findByStudent(
    @Param('studentId') studentId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.service.findByStudent(studentId, user);
  }
}
