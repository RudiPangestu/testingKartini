<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grade_kds', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('grade_book_id')->constrained('grade_books')->cascadeOnDelete();
            $table->integer('nomor'); // 1..5
            $table->string('deskripsi')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['grade_book_id', 'nomor']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grade_kds');
    }
};
