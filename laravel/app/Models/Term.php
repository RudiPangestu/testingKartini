<?php

namespace App\Models;

use App\Enums\TermType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Term extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'academic_year',
        'type',
        'name',
        'start_date',
        'end_date',
    ];

    protected function casts(): array
    {
        return [
            'type' => TermType::class,
            'start_date' => 'datetime',
            'end_date' => 'datetime',
        ];
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(AttendanceSession::class, 'term_id');
    }
}
