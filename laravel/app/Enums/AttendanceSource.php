<?php

namespace App\Enums;

enum AttendanceSource: string
{
    case SCHEDULE = 'SCHEDULE';
    case EVENT = 'EVENT';
}
