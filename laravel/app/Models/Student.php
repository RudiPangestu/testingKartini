<?php

namespace App\Models;

use App\Enums\Gender;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Student extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'nisn',
        'nis',
        'full_name',
        'class_id',
        'gender',
        'birth_date',
        'address',
        'user_id',
    ];

    protected function casts(): array
    {
        return [
            'gender' => Gender::class,
            'birth_date' => 'date',
        ];
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function parents(): HasMany
    {
        return $this->hasMany(StudentParent::class, 'student_id');
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class, 'student_id');
    }

    public function gradeScores(): HasMany
    {
        return $this->hasMany(GradeScore::class, 'student_id');
    }
}
