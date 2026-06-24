<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('interviews', function (Blueprint $table) {
            $table->id('interview_id');
            $table->foreignId('job_application_id')->references('application_id')->on('applications')->cascadeOnDelete();

            $table->string('interview_type')->nullable();
            // Initial, Technical, HR, Final, Assessment

            $table->dateTime('scheduled_at')->nullable();
            $table->string('location')->nullable();
            $table->string('meeting_link')->nullable();

            $table->string('status')->default('scheduled');
            // scheduled, completed, cancelled, missed

            $table->text('feedback')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('interviews');
    }
};
