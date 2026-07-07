import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { GradesService } from './grades.service';
import { CreateGradeBookDto } from './dto/create-grade-book.dto';
import { UpdateGradeBookDto } from './dto/update-grade-book.dto';
import { QueryGradeBookDto } from './dto/query-grade-book.dto';
import { SaveScoresDto } from './dto/save-scores.dto';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CurrentUser,
  JwtUser,
} from '../common/decorators/current-user.decorator';

// Daftar Nilai (Daflai) — hanya ADMIN & GURU.
@Roles(Role.ADMIN, Role.GURU)
@Controller('grades')
export class GradesController {
  constructor(private readonly service: GradesService) {}

  // Daftar buku nilai (overview).
  @Get('books')
  listBooks(@Query() query: QueryGradeBookDto, @CurrentUser() user: JwtUser) {
    return this.service.listBooks(query, user);
  }

  // Cari satu buku nilai berdasarkan kelas+mapel+tahun+cawu (bisa null).
  @Get('book')
  findBook(@Query() query: QueryGradeBookDto) {
    return this.service.findBook(query);
  }

  @Post('book')
  createBook(@Body() dto: CreateGradeBookDto, @CurrentUser() user: JwtUser) {
    return this.service.createBook(dto, user);
  }

  // Buku nilai lengkap + ringkasan & statistik terhitung.
  @Get('book/:id')
  getFullBook(@Param('id') id: string) {
    return this.service.getFullBook(id);
  }

  @Patch('book/:id')
  updateBook(
    @Param('id') id: string,
    @Body() dto: UpdateGradeBookDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.service.updateBook(id, dto, user);
  }

  @Delete('book/:id')
  removeBook(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.service.removeBook(id, user);
  }

  // Simpan nilai mentah massal.
  @Put('book/:id/scores')
  saveScores(
    @Param('id') id: string,
    @Body() dto: SaveScoresDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.service.saveScores(id, dto, user);
  }

  // KD
  @Post('book/:id/kd')
  addKd(
    @Param('id') id: string,
    @Body('deskripsi') deskripsi: string | undefined,
    @CurrentUser() user: JwtUser,
  ) {
    return this.service.addKd(id, deskripsi, user);
  }

  @Patch('kd/:kdId')
  updateKd(
    @Param('kdId') kdId: string,
    @Body('deskripsi') deskripsi: string | undefined,
    @CurrentUser() user: JwtUser,
  ) {
    return this.service.updateKd(kdId, deskripsi, user);
  }

  @Delete('kd/:kdId')
  removeKd(@Param('kdId') kdId: string, @CurrentUser() user: JwtUser) {
    return this.service.removeKd(kdId, user);
  }
}
