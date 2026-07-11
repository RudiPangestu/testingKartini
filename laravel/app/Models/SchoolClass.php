<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Kelas / rombongan belajar. (Nama model SchoolClass karena "Class" reserved di PHP.)
 */
class SchoolClass extends Model
{
    use HasUuids;

    protected $table = 'classes';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'name',
        'grade',
        'academic_year',
        'homeroom_teacher_id',
    ];

    protected function casts(): array
    {
        return [
            'grade' => 'integer',
        ];
    }

    public function homeroomTeacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'homeroom_teacher_id');
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class, 'class_id');
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(Schedule::class, 'class_id');
    }

    public function attendanceSessions(): HasMany
    {
        return $this->hasMany(AttendanceSession::class, 'class_id');
    }

    public function lessonLogs(): HasMany
    {
        return $this->hasMany(LessonLog::class, 'class_id');
    }

    public function gradeBooks(): HasMany
    {
        return $this->hasMany(GradeBook::class, 'class_id');
    }

    public function targetedEvents(): HasMany
    {
        return $this->hasMany(Event::class, 'target_class_id');
    }
}
