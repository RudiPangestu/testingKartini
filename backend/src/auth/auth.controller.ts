import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Post,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from '../common/decorators/public.decorator';
import {
  CurrentUser,
  JwtUser,
} from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Lebih ketat untuk cegah brute-force: maks 10 percobaan / menit / IP.
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // Pendaftaran mandiri ortu (maks 5 / menit / IP untuk cegah spam).
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Public()
  @Post('register')
  @HttpCode(201)
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // Dibuka langsung dari tautan di email → tampilkan halaman HTML konfirmasi
  // (bukan JSON), supaya verifikasi tetap jalan tanpa web frontend.
  @Public()
  @Get('verify-email')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async verifyEmail(@Query('token') token: string) {
    try {
      await this.authService.verifyEmail(token);
      return renderVerifyPage(
        true,
        'Email Terverifikasi',
        'Email Anda berhasil diverifikasi. Silakan kembali ke aplikasi SIPRES Kartini dan login.',
      );
    } catch (err) {
      return renderVerifyPage(
        false,
        'Verifikasi Gagal',
        (err as Error)?.message ?? 'Token tidak valid atau sudah kedaluwarsa.',
      );
    }
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Public()
  @Post('resend-verification')
  @HttpCode(200)
  resendVerification(@Body('email') email: string) {
    return this.authService.resendVerification(email);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Public()
  @Post('logout')
  @HttpCode(200)
  logout(@Body() dto: RefreshDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Get('me')
  me(@CurrentUser() user: JwtUser) {
    return this.authService.me(user.userId);
  }
}

/** Halaman HTML sederhana untuk hasil verifikasi email (dibuka di browser). */
function renderVerifyPage(
  ok: boolean,
  title: string,
  message: string,
): string {
  const color = ok ? '#224820' : '#b3261e';
  const icon = ok ? '✓' : '✕';
  const esc = (s: string) =>
    s.replace(/[&<>"]/g, (c) =>
      c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&quot;',
    );
  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)} — SIPRES Kartini</title>
<style>
  body { margin:0; font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif;
    background:#f3f4f1; display:flex; min-height:100vh; align-items:center; justify-content:center; }
  .card { background:#fff; max-width:420px; width:90%; padding:36px 28px; border-radius:16px;
    box-shadow:0 8px 30px rgba(0,0,0,.08); text-align:center; }
  .badge { width:72px; height:72px; border-radius:50%; background:${color}; color:#fff;
    font-size:38px; line-height:72px; margin:0 auto 20px; }
  h1 { color:${color}; font-size:22px; margin:0 0 10px; }
  p { color:#444; font-size:15px; line-height:1.5; margin:0; }
  .brand { margin-top:24px; color:#9aa39a; font-size:13px; }
</style>
</head>
<body>
  <div class="card">
    <div class="badge">${icon}</div>
    <h1>${esc(title)}</h1>
    <p>${esc(message)}</p>
    <div class="brand">SIPRES Kartini</div>
  </div>
</body>
</html>`;
}
