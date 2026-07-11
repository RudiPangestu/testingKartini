<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('terms', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('academic_year');
            $table->string('type');
            $table->string('name');
            $table->dateTime('start_date');
            $table->dateTime('end_date');

            $table->index(['academic_year', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('terms');
    }
};
