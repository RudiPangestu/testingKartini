<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('session_id')->constrained('attendance_sessions')->cascadeOnDelete();
            $table->foreignUuid('student_id')->constrained('students');
            $table->string('status'); // HADIR | SAKIT | IZIN | ALPHA
            $table->string('note')->nullable();
            $table->foreignUuid('recorded_by')->constrained('users');
            $table->timestamp('recorded_at')->useCurrent();

            $table->unique(['session_id', 'student_id']);
            $table->index('student_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance');
    }
};
