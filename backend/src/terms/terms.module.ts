import {
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Prisma, Role, TermType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Roles } from '../common/decorators/roles.decorator';

class CreateTermDto {
  @IsString()
  @IsNotEmpty({ message: 'Tahun ajaran wajib diisi' })
  academicYear: string;

  @IsEnum(TermType, { message: 'Tipe periode harus SEMESTER/TRIWULAN/MID' })
  type: TermType;

  @IsString()
  @IsNotEmpty({ message: 'Nama periode wajib diisi' })
  name: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}

class UpdateTermDto {
  @IsOptional() @IsString() academicYear?: string;
  @IsOptional() @IsEnum(TermType) type?: TermType;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
}

@Injectable()
export class TermsService {
  constructor(private prisma: PrismaService) {}

  findAll(academicYear?: string, type?: TermType) {
    const where: Prisma.TermWhereInput = {
      ...(academicYear ? { academicYear } : {}),
      ...(type ? { type } : {}),
    };
    return this.prisma.term.findMany({
      where,
      orderBy: { startDate: 'asc' },
    });
  }

  async findOne(id: string) {
    const term = await this.prisma.term.findUnique({ where: { id } });
    if (!term) throw new NotFoundException('Periode tidak ditemukan');
    return term;
  }

  // Cari periode (tipe tertentu) yang memuat tanggal — dipakai saat buat sesi presensi.
  findContaining(date: Date, type: TermType = TermType.SEMESTER) {
    return this.prisma.term.findFirst({
      where: { type, startDate: { lte: date }, endDate: { gte: date } },
    });
  }

  create(dto: CreateTermDto) {
    return this.prisma.term.create({
      data: {
        academicYear: dto.academicYear,
        type: dto.type,
        name: dto.name,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
    });
  }

  async update(id: string, dto: UpdateTermDto) {
    await this.findOne(id);
    return this.prisma.term.update({
      where: { id },
      data: {
        academicYear: dto.academicYear,
        type: dto.type,
        name: dto.name,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.term.delete({ where: { id } });
    return { message: 'Periode berhasil dihapus' };
  }
}

@Controller('terms')
class TermsController {
  constructor(private readonly service: TermsService) {}

  @Roles(Role.ADMIN, Role.GURU, Role.ORTU, Role.MURID)
  @Get()
  findAll(
    @Query('academicYear') academicYear?: string,
    @Query('type') type?: TermType,
  ) {
    return this.service.findAll(academicYear, type);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateTermDto) {
    return this.service.create(dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTermDto) {
    return this.service.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

@Module({
  controllers: [TermsController],
  providers: [TermsService],
  exports: [TermsService],
})
export class TermsModule {}
