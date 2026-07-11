<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Nilai mentah: siswa × KD × komponen × kolom ke-. NA/NR/predikat dihitung di service.
        Schema::create('grade_scores', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('grade_book_id')->constrained('grade_books')->cascadeOnDelete();
            $table->foreignUuid('kd_id')->constrained('grade_kds')->cascadeOnDelete();
            $table->foreignUuid('student_id')->constrained('students')->cascadeOnDelete();
            $table->string('komponen'); // PENGETAHUAN | PRAKTEK
            $table->integer('urutan');  // kolom ke- (1,2,3,...)
            $table->double('nilai');
            $table->timestamps();

            $table->unique(['kd_id', 'student_id', 'komponen', 'urutan']);
            $table->index('grade_book_id');
            $table->index('student_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grade_scores');
    }
};
