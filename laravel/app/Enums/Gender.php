<?php

namespace App\Enums;

enum Gender: string
{
    case L = 'L';
    case P = 'P';

    public function label(): string
    {
        return $this === self::L ? 'Laki-laki' : 'Perempuan';
    }
}
