<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('type');    // KEHADIRAN | REMINDER | INFO
            $table->string('title');
            $table->text('body');
            $table->string('channel');  // PUSH | EMAIL | WA
            $table->boolean('is_read')->default(false);
            $table->timestamp('sent_at')->useCurrent();

            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
