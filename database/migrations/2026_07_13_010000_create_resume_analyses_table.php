<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('resume_analyses', function (Blueprint $table) {
            $table->id('resume_analysis_id');
            $table->foreignId('user_id')->references('user_id')->on('users')->cascadeOnDelete();
            $table->foreignId('job_application_id')->references('application_id')->on('applications')->cascadeOnDelete();
            $table->foreignId('resume_document_id')->nullable()->references('document_id')->on('documents')->nullOnDelete();
            $table->text('job_description');
            $table->string('job_post_url')->nullable();
            $table->unsignedTinyInteger('match_score');
            $table->json('analysis');
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('resume_analyses');
    }
};
