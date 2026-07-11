import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { Response } from 'express';
import { ImportService } from './import.service';
import { Roles } from '../common/decorators/roles.decorator';

// Objek file dari multer (memory storage) — cukup properti yang dipakai.
interface UploadedXlsx {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

const XLSX_UPLOAD = { limits: { fileSize: 10 * 1024 * 1024 } }; // 10 MB

@Roles(Role.ADMIN)
@Controller('import')
export class ImportController {
  constructor(private readonly service: ImportService) {}

  // Unduh template .xlsx: entity = classes | subjects | students | parents
  @Get('template/:entity')
  async template(@Param('entity') entity: string, @Res() res: Response) {
    const { buffer, filename } = await this.service.template(entity);
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Post('classes')
  @UseInterceptors(FileInterceptor('file', XLSX_UPLOAD))
  importClasses(@UploadedFile() file: UploadedXlsx) {
    return this.service.importClasses(this.buf(file));
  }

  @Post('subjects')
  @UseInterceptors(FileInterceptor('file', XLSX_UPLOAD))
  importSubjects(@UploadedFile() file: UploadedXlsx) {
    return this.service.importSubjects(this.buf(file));
  }

  @Post('students')
  @UseInterceptors(FileInterceptor('file', XLSX_UPLOAD))
  importStudents(@UploadedFile() file: UploadedXlsx) {
    return this.service.importStudents(this.buf(file));
  }

  @Post('parents')
  @UseInterceptors(FileInterceptor('file', XLSX_UPLOAD))
  importParents(@UploadedFile() file: UploadedXlsx) {
    return this.service.importParents(this.buf(file));
  }

  private buf(file: UploadedXlsx): Buffer {
    if (!file?.buffer) {
      throw new BadRequestException('File tidak ditemukan (field "file")');
    }
    return file.buffer;
  }
}
