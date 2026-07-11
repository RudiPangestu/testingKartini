<?php

namespace App\Models;

use App\Enums\Role;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'role',
        'full_name',
        'email',
        'phone',
        'password_hash',
        'is_active',
        'email_verified_at',
    ];

    protected $hidden = [
        'password_hash',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'role' => Role::class,
            'is_active' => 'boolean',
            'email_verified_at' => 'datetime',
        ];
    }

    /** Kolom password kustom: password_hash (bukan 'password'). */
    public function getAuthPassword(): string
    {
        return $this->password_hash;
    }

    public function isRole(Role ...$roles): bool
    {
        return in_array($this->role, $roles, true);
    }

    // ---------------- Relasi ----------------
    public function homeroomClasses(): HasMany
    {
        return $this->hasMany(SchoolClass::class, 'homeroom_teacher_id');
    }

    public function teachingSchedules(): HasMany
    {
        return $this->hasMany(Schedule::class, 'teacher_id');
    }

    public function lessonLogs(): HasMany
    {
        return $this->hasMany(LessonLog::class, 'teacher_id');
    }

    public function gradeBooks(): HasMany
    {
        return $this->hasMany(GradeBook::class, 'teacher_id');
    }

    public function studentProfile(): HasOne
    {
        return $this->hasOne(Student::class, 'user_id');
    }

    public function parentLinks(): HasMany
    {
        return $this->hasMany(StudentParent::class, 'parent_user_id');
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class, 'user_id');
    }

    public function pushTokens(): HasMany
    {
        return $this->hasMany(PushToken::class, 'user_id');
    }
}
