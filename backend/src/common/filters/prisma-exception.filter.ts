import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

/**
 * Mengubah error Prisma yang umum menjadi respons HTTP yang ramah,
 * alih-alih 500 mentah. Mis. menghapus data yang masih direferensikan.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    let status = HttpStatus.BAD_REQUEST;
    let message = 'Permintaan tidak dapat diproses.';

    switch (exception.code) {
      case 'P2002': // unique constraint
        status = HttpStatus.CONFLICT;
        message = 'Data sudah ada (melanggar keunikan).';
        break;
      case 'P2003': // foreign key constraint
        status = HttpStatus.CONFLICT;
        message =
          'Data masih dipakai oleh data lain, sehingga tidak dapat dihapus atau diubah.';
        break;
      case 'P2025': // record not found
        status = HttpStatus.NOT_FOUND;
        message = 'Data tidak ditemukan.';
        break;
    }

    res.status(status).json({ statusCode: status, error: 'Database', message });
  }
}
