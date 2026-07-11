<?php

namespace Database\Seeders;

use App\Enums\Gender;
use App\Enums\Role;
use App\Models\SchoolClass;
use App\Models\Setting;
use App\Models\Student;
use App\Models\StudentParent;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ---- Akun demo (password: "password") ----
        $admin = User::create([
            'role' => Role::ADMIN,
            'full_name' => 'Administrator',
            'email' => 'admin@kartini.sch.id',
            'password_hash' => Hash::make('password'),
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        $guru = User::create([
            'role' => Role::GURU,
            'full_name' => 'Budi Santoso',
            'email' => 'guru@kartini.sch.id',
            'password_hash' => Hash::make('password'),
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        $ortu = User::create([
            'role' => Role::ORTU,
            'full_name' => 'Siti Aminah',
            'email' => 'ortu@kartini.sch.id',
            'phone' => '081200000002',
            'password_hash' => Hash::make('password'),
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        $muridUser = User::create([
            'role' => Role::MURID,
            'full_name' => 'Andi Pratama',
            'email' => 'murid@kartini.sch.id',
            'password_hash' => Hash::make('password'),
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        // ---- Data master contoh ----
        $kelas = SchoolClass::create([
            'name' => 'X IPA 1',
            'grade' => 10,
            'academic_year' => '2025/2026',
            'homeroom_teacher_id' => $guru->id,
        ]);

        Subject::create(['name' => 'Matematika', 'code' => 'MAT']);
        Subject::create(['name' => 'Bahasa Indonesia', 'code' => 'BIND']);

        $andi = Student::create([
            'nisn' => '0012345678',
            'nis' => '12345',
            'full_name' => 'Andi Pratama',
            'class_id' => $kelas->id,
            'gender' => Gender::L,
            'user_id' => $muridUser->id,
        ]);

        StudentParent::create([
            'student_id' => $andi->id,
            'parent_user_id' => $ortu->id,
            'relation' => 'ibu',
        ]);

        // ---- Pengaturan singleton ----
        Setting::current();
    }
}
