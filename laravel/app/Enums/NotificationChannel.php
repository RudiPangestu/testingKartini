<?php

namespace App\Enums;

enum NotificationChannel: string
{
    case PUSH = 'PUSH';
    case EMAIL = 'EMAIL';
    case WA = 'WA';
}
