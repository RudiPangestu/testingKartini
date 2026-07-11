<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grade_books', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('class_id')->constrained('classes');
            $table->foreignUuid('subject_id')->constrained('subjects');
            $table->foreignUuid('teacher_id')->constrained('users');
            $table->string('academic_year');
            $table->integer('cawu'); // caturwulan 1..3
            $table->integer('kkm')->default(75);
            $table->timestamps();

            $table->unique(['class_id', 'subject_id', 'academic_year', 'cawu']);
            $table->index('teacher_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grade_books');
    }
};
