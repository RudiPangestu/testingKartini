<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nisn')->unique();
            $table->string('nis')->nullable();
            $table->string('full_name');
            $table->foreignUuid('class_id')->nullable()->constrained('classes')->nullOnDelete();
            $table->string('gender')->nullable();
            $table->date('birth_date')->nullable();
            $table->string('address')->nullable();
            $table->foreignUuid('user_id')->nullable()->unique()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('class_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
