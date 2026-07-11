<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subject extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'name',
        'code',
    ];

    public function schedules(): HasMany
    {
        return $this->hasMany(Schedule::class, 'subject_id');
    }

    public function lessonLogs(): HasMany
    {
        return $this->hasMany(LessonLog::class, 'subject_id');
    }

    public function gradeBooks(): HasMany
    {
        return $this->hasMany(GradeBook::class, 'subject_id');
    }
}
