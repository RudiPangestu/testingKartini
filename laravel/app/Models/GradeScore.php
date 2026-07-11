<?php

namespace App\Models;

use App\Enums\GradeComponentType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Satu nilai mentah: siswa × KD × komponen × kolom ke-. */
class GradeScore extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'grade_book_id',
        'kd_id',
        'student_id',
        'komponen',
        'urutan',
        'nilai',
    ];

    protected function casts(): array
    {
        return [
            'komponen' => GradeComponentType::class,
            'urutan' => 'integer',
            'nilai' => 'float',
        ];
    }

    public function gradeBook(): BelongsTo
    {
        return $this->belongsTo(GradeBook::class, 'grade_book_id');
    }

    public function kd(): BelongsTo
    {
        return $this->belongsTo(GradeKd::class, 'kd_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }
}
