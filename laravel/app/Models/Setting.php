<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Singleton pengaturan sekolah (id = 'singleton'). */
class Setting extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    const CREATED_AT = null; // hanya updated_at

    protected $fillable = [
        'id',
        'channel_push',
        'channel_email',
        'channel_wa',
        'notify_statuses',
        'attendance_template',
        'reminder_template',
        'reminder_hour',
        'weekly_recap_enabled',
    ];

    protected function casts(): array
    {
        return [
            'channel_push' => 'boolean',
            'channel_email' => 'boolean',
            'channel_wa' => 'boolean',
            'notify_statuses' => 'array',
            'reminder_hour' => 'integer',
            'weekly_recap_enabled' => 'boolean',
        ];
    }

    /** Ambil (atau buat) baris tunggal pengaturan. */
    public static function current(): self
    {
        return static::firstOrCreate(
            ['id' => 'singleton'],
            [
                'notify_statuses' => ['SAKIT', 'IZIN', 'ALPHA'],
                'attendance_template' => 'Ananda {nama} tercatat {status} pada {tanggal}.',
                'reminder_template' => 'Pengingat: mohon konfirmasi kehadiran ananda {nama}.',
            ],
        );
    }
}
