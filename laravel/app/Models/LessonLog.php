<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Buku Batas Pembelajaran: satu baris = satu pertemuan mengajar. */
class LessonLog extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'class_id',
        'teacher_id',
        'subject_id',
        'date',
        'jam_ke',
        'nama_siswa',
        'pokok_bahasan',
        'metode',
        'selesai',
        'siswa_tidak_hadir',
        'refleksi',
        'tindak_lanjut',
        'academic_year',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'datetime',
            'selesai' => 'boolean',
        ];
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class, 'subject_id');
    }
}
