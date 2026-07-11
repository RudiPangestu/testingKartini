<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lesson_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('class_id')->constrained('classes');
            $table->foreignUuid('teacher_id')->constrained('users');
            $table->foreignUuid('subject_id')->nullable()->constrained('subjects')->nullOnDelete();
            $table->dateTime('date');
            $table->string('jam_ke'); // mis. "1-2"
            $table->string('nama_siswa')->nullable();
            $table->text('pokok_bahasan');
            $table->string('metode')->nullable();
            $table->boolean('selesai')->default(true);
            $table->text('siswa_tidak_hadir')->nullable();
            $table->text('refleksi')->nullable();
            $table->text('tindak_lanjut')->nullable();
            $table->string('academic_year');
            $table->timestamps();

            $table->index(['class_id', 'date']);
            $table->index('teacher_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_logs');
    }
};
