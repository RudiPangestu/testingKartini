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
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { QueryStudentDto } from './dto/query-student.dto';
import { LinkParentDto } from './dto/link-parent.dto';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CurrentUser,
  JwtUser,
} from '../common/decorators/current-user.decorator';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Roles(Role.ADMIN, Role.GURU)
  @Get()
  findAll(@Query() query: QueryStudentDto) {
    return this.studentsService.findAll(query);
  }

  // Murid milik user login (ORTU: anak-anaknya, MURID: dirinya).
  // Didefinisikan sebelum ':id' agar tidak tertangkap sebagai param.
  @Roles(Role.ORTU, Role.MURID)
  @Get('mine')
  findMine(@CurrentUser() user: JwtUser) {
    return this.studentsService.findMine(user.userId, user.role);
  }

  @Roles(Role.ADMIN, Role.GURU, Role.ORTU, Role.MURID)
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.studentsService.findOne(id, user);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateStudentDto) {
    return this.studentsService.create(dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.studentsService.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }

  @Roles(Role.ADMIN)
  @Post(':id/parents')
  linkParent(@Param('id') id: string, @Body() dto: LinkParentDto) {
    return this.studentsService.linkParent(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id/parents/:parentUserId')
  unlinkParent(
    @Param('id') id: string,
    @Param('parentUserId') parentUserId: string,
  ) {
    return this.studentsService.unlinkParent(id, parentUserId);
  }
}
