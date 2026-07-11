<?php

use App\Models\Attendance;
use App\Models\Notification;
use App\Models\Setting;
use App\Models\StudentParent;
use Illuminate\Support\Facades\Schedule;

/**
 * Tugas terjadwal (setara modul scheduler NestJS).
 * Jalankan worker: `php artisan schedule:work` (atau cron ke `schedule:run`).
 */

// Pengingat kehadiran harian: notifikasi ke ortu untuk status terpilih hari ini.
Schedule::call(function () {
    $setting = Setting::current();
    $statuses = $setting->notify_statuses ?: ['SAKIT', 'IZIN', 'ALPHA'];
    $today = now()->toDateString();

    $recs = Attendance::whereHas('session', fn ($q) => $q->whereDate('session_date', $today))
        ->whereIn('status', $statuses)
        ->with('student')
        ->get();

    foreach ($recs as $r) {
        $parents = StudentParent::where('student_id', $r->student_id)->pluck('parent_user_id');
        foreach ($parents as $uid) {
            Notification::create([
                'user_id' => $uid,
                'type' => 'KEHADIRAN',
                'channel' => 'PUSH',
                'title' => 'Info Kehadiran Ananda',
                'body' => str_replace(
                    ['{nama}', '{status}', '{tanggal}'],
                    [$r->student?->full_name, $r->status->value, now()->format('d/m/Y')],
                    $setting->attendance_template,
                ),
            ]);
        }
    }
})->dailyAt('17:00')->name('reminder-kehadiran')->withoutOverlapping();

// Rekap mingguan (Sabtu 07:00) — hanya jalan bila diaktifkan di Pengaturan.
Schedule::call(function () {
    if (! Setting::current()->weekly_recap_enabled) {
        return;
    }
    // (Ringkasan mingguan ke ortu — implementasi ringkas; bisa diperluas.)
})->weeklyOn(6, '07:00')->name('rekap-mingguan')->withoutOverlapping();
