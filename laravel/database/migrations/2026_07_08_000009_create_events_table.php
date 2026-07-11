<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->text('description')->nullable();
            $table->dateTime('event_date');
            $table->string('start_time');
            $table->string('end_time');
            $table->string('location')->nullable();
            $table->foreignUuid('target_class_id')->nullable()->constrained('classes')->nullOnDelete();
            $table->foreignUuid('created_by')->constrained('users');
            $table->timestamp('created_at')->useCurrent();

            $table->index('event_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
