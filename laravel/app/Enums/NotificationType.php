<?php

namespace App\Enums;

enum NotificationType: string
{
    case KEHADIRAN = 'KEHADIRAN';
    case REMINDER = 'REMINDER';
    case INFO = 'INFO';
}
