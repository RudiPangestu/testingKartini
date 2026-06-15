import {
  Body,
  Controller,
  Get,
  Global,
  Injectable,
  Module,
  Put,
} from '@nestjs/common';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Role, Setting } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Roles } from '../common/decorators/roles.decorator';

const SINGLETON = 'singleton';

const DEFAULTS = {
  channelPush: true,
  channelEmail: true,
  channelWa: false,
  notifyStatuses: ['SAKIT', 'IZIN', 'ALPHA'],
  attendanceTemplate:
    'Ananda {nama} tercatat {status} pada {konteks}, tanggal {tanggal}.',
  reminderTemplate: 'Reminder: besok ada "{judul}" pukul {jam}{lokasi}.',
  reminderHour: 17,
  weeklyRecapEnabled: false,
};

class UpdateSettingDto {
  @IsOptional() @IsBoolean() channelPush?: boolean;
  @IsOptional() @IsBoolean() channelEmail?: boolean;
  @IsOptional() @IsBoolean() channelWa?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notifyStatuses?: string[];

  @IsOptional() @IsString() attendanceTemplate?: string;
  @IsOptional() @IsString() reminderTemplate?: string;

  @IsOptional() @IsInt() @Min(0) @Max(23) reminderHour?: number;
  @IsOptional() @IsBoolean() weeklyRecapEnabled?: boolean;
}

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  // Cache memori singkat agar tidak query DB tiap kirim notifikasi.
  private cache: Setting | null = null;
  private cacheAt = 0;
  private readonly TTL = 30_000;

  async get(): Promise<Setting> {
    if (this.cache && Date.now() - this.cacheAt < this.TTL) {
      return this.cache;
    }
    let setting = await this.prisma.setting.findUnique({
      where: { id: SINGLETON },
    });
    if (!setting) {
      setting = await this.prisma.setting.create({
        data: { id: SINGLETON, ...DEFAULTS },
      });
    }
    this.cache = setting;
    this.cacheAt = Date.now();
    return setting;
  }

  async update(dto: UpdateSettingDto): Promise<Setting> {
    const setting = await this.prisma.setting.upsert({
      where: { id: SINGLETON },
      create: { id: SINGLETON, ...DEFAULTS, ...dto },
      update: { ...dto },
    });
    this.cache = setting;
    this.cacheAt = Date.now();
    return setting;
  }

  /** Ganti placeholder {key} dengan nilai dari vars. */
  render(template: string, vars: Record<string, string>): string {
    return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
  }
}

@Controller('settings')
class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Roles(Role.ADMIN)
  @Get()
  get() {
    return this.service.get();
  }

  @Roles(Role.ADMIN)
  @Put()
  update(@Body() dto: UpdateSettingDto) {
    return this.service.update(dto);
  }
}

@Global()
@Module({
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
