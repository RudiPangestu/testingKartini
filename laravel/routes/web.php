<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => redirect('/dashboard'));

// ---- Auth ----
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
});
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth')->name('logout');

// ---- Halaman terautentikasi ----
Route::middleware('auth')->group(function () {
    Route::view('/dashboard', 'dashboard')->name('dashboard');

    // ---- Modul admin/guru ----
    Route::get('/users', \App\Livewire\Users\Index::class)
        ->middleware('role:ADMIN')->name('users');

    Route::get('/subjects', \App\Livewire\Subjects\Index::class)
        ->middleware('role:ADMIN,GURU')->name('subjects');
    Route::get('/classes', \App\Livewire\Classes\Index::class)
        ->middleware('role:ADMIN,GURU')->name('classes');
    Route::get('/students', \App\Livewire\Students\Index::class)
        ->middleware('role:ADMIN,GURU')->name('students');
    Route::get('/schedules', \App\Livewire\Schedules\Index::class)
        ->middleware('role:ADMIN,GURU')->name('schedules');
    Route::get('/events', \App\Livewire\Events\Index::class)
        ->middleware('role:ADMIN,GURU')->name('events');
    Route::get('/terms', \App\Livewire\Terms\Index::class)
        ->middleware('role:ADMIN,GURU')->name('terms');
    Route::get('/settings', \App\Livewire\Settings\Index::class)
        ->middleware('role:ADMIN')->name('settings');

    Route::get('/lesson-logs', \App\Livewire\LessonLogs\Index::class)
        ->middleware('role:ADMIN,GURU')->name('lesson-logs');
    Route::get('/grades', \App\Livewire\Grades\Index::class)
        ->middleware('role:ADMIN,GURU')->name('grades');
    Route::get('/grades/{book}', \App\Livewire\Grades\Input::class)
        ->middleware('role:ADMIN,GURU')->name('grades.input');

    Route::get('/attendance', \App\Livewire\Attendance\Index::class)
        ->middleware('role:ADMIN,GURU')->name('attendance');
    Route::get('/daftar-hadir', \App\Livewire\DaftarHadir\Index::class)
        ->middleware('role:ADMIN,GURU')->name('daftar-hadir');
    Route::get('/reports', \App\Livewire\Reports\Index::class)
        ->middleware('role:ADMIN,GURU')->name('reports');
    Route::get('/announcements', \App\Livewire\Announcements\Index::class)
        ->middleware('role:ADMIN,GURU')->name('announcements');

    // ---- Semua peran ----
    Route::get('/notifications', \App\Livewire\Notifications\Index::class)->name('notifications');
    Route::get('/profile', \App\Livewire\Profile\Index::class)->name('profile');

    // ---- Portal keluarga (ORTU/MURID) ----
    Route::get('/keluarga/rekap', \App\Livewire\Family\Reports::class)
        ->middleware('role:ORTU,MURID')->name('family.reports');
    Route::get('/keluarga/agenda', \App\Livewire\Family\Agenda::class)
        ->middleware('role:ORTU,MURID')->name('family.agenda');
});
