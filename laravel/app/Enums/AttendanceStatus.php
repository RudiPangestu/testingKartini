<?php

namespace App\Enums;

enum AttendanceStatus: string
{
    case HADIR = 'HADIR';
    case SAKIT = 'SAKIT';
    case IZIN = 'IZIN';
    case ALPHA = 'ALPHA';

    public function label(): string
    {
        return match ($this) {
            self::HADIR => 'Hadir',
            self::SAKIT => 'Sakit',
            self::IZIN => 'Izin',
            self::ALPHA => 'Alpha',
        };
    }

    /** Karakter singkat untuk matriks daftar hadir. */
    public function char(): string
    {
        return match ($this) {
            self::HADIR => '•',
            self::SAKIT => 'S',
            self::IZIN => 'I',
            self::ALPHA => 'A',
        };
    }
}
