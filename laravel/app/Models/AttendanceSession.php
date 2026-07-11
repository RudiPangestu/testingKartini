<?php

namespace App\Models;

use App\Enums\AttendanceSource;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AttendanceSession extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;
    const UPDATED_AT = null; // hanya created_at

    protected $fillable = [
        'source_type',
        'schedule_id',
        'event_id',
        'class_id',
        'session_date',
        'term_id',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'source_type' => AttendanceSource::class,
            'session_date' => 'datetime',
        ];
    }

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(Schedule::class, 'schedule_id');
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class, 'event_id');
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function term(): BelongsTo
    {
        return $this->belongsTo(Term::class, 'term_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function records(): HasMany
    {
        return $this->hasMany(Attendance::class, 'session_id');
    }
}
