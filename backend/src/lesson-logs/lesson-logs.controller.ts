import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { LessonLogsService } from './lesson-logs.service';
import { CreateLessonLogDto } from './dto/create-lesson-log.dto';
import { UpdateLessonLogDto } from './dto/update-lesson-log.dto';
import { QueryLessonLogDto } from './dto/query-lesson-log.dto';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CurrentUser,
  JwtUser,
} from '../common/decorators/current-user.decorator';

// Buku Batas Pembelajaran — hanya ADMIN & GURU yang mengisi & melihat.
@Roles(Role.ADMIN, Role.GURU)
@Controller('lesson-logs')
export class LessonLogsController {
  constructor(private readonly service: LessonLogsService) {}

  @Get()
  findAll(@Query() query: QueryLessonLogDto) {
    return this.service.findAll(query);
  }

  // Prefill "Siswa Tidak Hadir" dari data presensi.
  @Get('suggest-absent')
  suggestAbsent(
    @Query('classId') classId: string,
    @Query('date') date: string,
  ) {
    return this.service.suggestAbsent(classId, date);
  }

  @Post()
  create(@Body() dto: CreateLessonLogDto, @CurrentUser() user: JwtUser) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLessonLogDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.service.remove(id, user);
  }
}
