<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;
    const UPDATED_AT = null; // hanya created_at

    protected $fillable = [
        'title',
        'description',
        'event_date',
        'start_time',
        'end_time',
        'location',
        'target_class_id',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'event_date' => 'datetime',
        ];
    }

    public function targetClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'target_class_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(AttendanceSession::class, 'event_id');
    }
}
