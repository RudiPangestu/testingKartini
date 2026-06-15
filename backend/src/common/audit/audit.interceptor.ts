import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtUser } from '../decorators/current-user.decorator';

const MUTATING = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);
const SENSITIVE_KEYS = ['password', 'passwordHash', 'refreshToken', 'token'];

/**
 * Mencatat setiap operasi yang mengubah data (POST/PATCH/PUT/DELETE) ke tabel
 * audit_logs: siapa (actor), aksi, entitas, id, dan ringkasan perubahan.
 * Berjalan setelah handler sukses; kegagalan menulis log tidak mengganggu respons.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const method: string = req.method;

    // Hanya operasi mutasi; lewati endpoint auth (mengandung kredensial).
    const url: string = req.originalUrl || req.url || '';
    if (!MUTATING.has(method) || url.includes('/auth/')) {
      return next.handle();
    }

    const user = req.user as JwtUser | undefined;
    const entity = this.entityFromUrl(url);
    const paramId = req.params?.id as string | undefined;
    const changes = this.sanitize(req.body);

    return next.handle().pipe(
      tap((result) => {
        const entityId =
          paramId ??
          (result && typeof result === 'object' && 'id' in result
            ? (result as { id?: string }).id
            : undefined);
        // fire-and-forget; jangan blokir/menggagalkan respons
        this.prisma.auditLog
          .create({
            data: {
              actorId: user?.userId ?? null,
              action: method,
              entity,
              entityId: entityId ?? null,
              changes,
            },
          })
          .catch((err) =>
            this.logger.warn(`Gagal menulis audit log: ${err.message}`),
          );
      }),
    );
  }

  private entityFromUrl(url: string): string {
    // /api/v1/students/123 -> "students"
    const after = url.split('?')[0].replace(/^\/api\/v1\//, '');
    return after.split('/')[0] || 'unknown';
  }

  private sanitize(body: unknown): object | undefined {
    if (!body || typeof body !== 'object') return undefined;
    const clone: Record<string, unknown> = { ...(body as object) };
    for (const k of SENSITIVE_KEYS) {
      if (k in clone) clone[k] = '***';
    }
    return clone;
  }
}
