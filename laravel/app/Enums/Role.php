<?php

namespace App\Enums;

enum Role: string
{
    case ADMIN = 'ADMIN';
    case GURU = 'GURU';
    case ORTU = 'ORTU';
    case MURID = 'MURID';

    public function label(): string
    {
        return match ($this) {
            self::ADMIN => 'Administrator',
            self::GURU => 'Guru',
            self::ORTU => 'Orang Tua',
            self::MURID => 'Murid',
        };
    }
}
