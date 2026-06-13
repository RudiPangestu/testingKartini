import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

// Cegah boot produksi dengan secret JWT default (token bisa dipalsukan).
function assertSecrets() {
  if (process.env.NODE_ENV !== 'production') return;
  const missing = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'].filter(
    (k) => !process.env[k],
  );
  if (missing.length > 0) {
    throw new Error(
      `Variabel lingkungan wajib belum diset di produksi: ${missing.join(', ')}`,
    );
  }
}

async function bootstrap() {
  assertSecrets();
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  // CORS: batasi origin lewat env CORS_ORIGIN (pisah koma) bila diset.
  const corsOrigin = process.env.CORS_ORIGIN;
  app.enableCors(
    corsOrigin ? { origin: corsOrigin.split(',').map((o) => o.trim()) } : {},
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new PrismaExceptionFilter());

  const port = process.env.PORT || 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`SIPRES Kartini API berjalan di http://localhost:${port}/api/v1`);
}
bootstrap();
