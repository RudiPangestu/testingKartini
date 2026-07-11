<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('source_type'); // SCHEDULE | EVENT
            $table->foreignUuid('schedule_id')->nullable()->constrained('schedules')->nullOnDelete();
            $table->foreignUuid('event_id')->nullable()->constrained('events')->nullOnDelete();
            // Snapshot kelas saat sesi dibuat (agar rekap historis akurat).
            $table->foreignUuid('class_id')->nullable()->constrained('classes')->nullOnDelete();
            $table->dateTime('session_date');
            $table->foreignUuid('term_id')->nullable()->constrained('terms')->nullOnDelete();
            $table->foreignUuid('created_by')->constrained('users');
            $table->timestamp('created_at')->useCurrent();

            $table->index('session_date');
            $table->index('term_id');
            $table->index('class_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_sessions');
    }
};
