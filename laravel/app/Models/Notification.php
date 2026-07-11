<?php

namespace App\Models;

use App\Enums\NotificationChannel;
use App\Enums\NotificationType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'body',
        'channel',
        'is_read',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'type' => NotificationType::class,
            'channel' => NotificationChannel::class,
            'is_read' => 'boolean',
            'sent_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
