<?php

namespace App\Enums;

enum DayOfWeek: string
{
    case SEN = 'SEN';
    case SEL = 'SEL';
    case RAB = 'RAB';
    case KAM = 'KAM';
    case JUM = 'JUM';
    case SAB = 'SAB';

    public function label(): string
    {
        return match ($this) {
            self::SEN => 'Senin',
            self::SEL => 'Selasa',
            self::RAB => 'Rabu',
            self::KAM => 'Kamis',
            self::JUM => 'Jumat',
            self::SAB => 'Sabtu',
        };
    }
}
