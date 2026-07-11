<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('classes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->integer('grade');
            $table->string('academic_year');
            $table->foreignUuid('homeroom_teacher_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('academic_year');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('classes');
    }
};
