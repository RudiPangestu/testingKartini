<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Singleton: satu baris pengaturan notifikasi & template.
        Schema::create('settings', function (Blueprint $table) {
            $table->string('id')->primary()->default('singleton');
            $table->boolean('channel_push')->default(true);
            $table->boolean('channel_email')->default(true);
            $table->boolean('channel_wa')->default(false);
            $table->json('notify_statuses'); // mis. ["SAKIT","IZIN","ALPHA"]
            $table->text('attendance_template');
            $table->text('reminder_template');
            $table->integer('reminder_hour')->default(17);
            $table->boolean('weekly_recap_enabled')->default(false);
            $table->timestamp('updated_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
