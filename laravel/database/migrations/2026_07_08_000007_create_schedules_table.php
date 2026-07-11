<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schedules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('subject_id')->constrained('subjects');
            $table->foreignUuid('class_id')->constrained('classes');
            $table->foreignUuid('teacher_id')->constrained('users');
            $table->string('day_of_week');
            $table->string('start_time'); // "HH:mm"
            $table->string('end_time');
            $table->string('academic_year');
            $table->timestamps();

            $table->index('class_id');
            $table->index('teacher_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schedules');
    }
};
