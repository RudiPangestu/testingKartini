<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** Buku nilai: satu mapel × kelas × cawu × tahun pelajaran. */
class GradeBook extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'class_id',
        'subject_id',
        'teacher_id',
        'academic_year',
        'cawu',
        'kkm',
    ];

    protected function casts(): array
    {
        return [
            'cawu' => 'integer',
            'kkm' => 'integer',
        ];
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class, 'subject_id');
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function kds(): HasMany
    {
        return $this->hasMany(GradeKd::class, 'grade_book_id');
    }

    public function scores(): HasMany
    {
        return $this->hasMany(GradeScore::class, 'grade_book_id');
    }
}
