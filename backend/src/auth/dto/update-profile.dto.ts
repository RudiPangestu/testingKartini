import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

// Self-service: user mengubah profilnya sendiri (nama, telepon, password).
// Email & role tidak bisa diubah sendiri (perlu admin / verifikasi ulang).
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Nama tidak boleh kosong' })
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  // Ganti password: password lama wajib bila password baru diisi.
  @ValidateIf((o) => o.newPassword !== undefined)
  @IsString()
  @IsNotEmpty({ message: 'Password saat ini wajib diisi' })
  currentPassword?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password baru minimal 6 karakter' })
  newPassword?: string;
}
