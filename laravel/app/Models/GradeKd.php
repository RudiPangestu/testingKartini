<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** Kompetensi Dasar (KD.1..KD.5) dalam sebuah buku nilai. */
class GradeKd extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;
    const UPDATED_AT = null; // hanya created_at

    protected $fillable = [
        'grade_book_id',
        'nomor',
        'deskripsi',
    ];

    protected function casts(): array
    {
        return [
            'nomor' => 'integer',
        ];
    }

    public function gradeBook(): BelongsTo
    {
        return $this->belongsTo(GradeBook::class, 'grade_book_id');
    }

    public function scores(): HasMany
    {
        return $this->hasMany(GradeScore::class, 'kd_id');
    }
}
