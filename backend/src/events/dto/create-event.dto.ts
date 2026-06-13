import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class CreateEventDto {
  @IsString()
  @IsNotEmpty({ message: 'Judul kegiatan wajib diisi' })
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString({}, { message: 'Tanggal kegiatan tidak valid' })
  eventDate: string;

  @Matches(TIME_REGEX, { message: 'Jam mulai harus format HH:mm' })
  startTime: string;

  @Matches(TIME_REGEX, { message: 'Jam selesai harus format HH:mm' })
  endTime: string;

  @IsOptional()
  @IsString()
  location?: string;

  // null = berlaku untuk semua kelas
  @IsOptional()
  @IsUUID()
  targetClassId?: string;
}
