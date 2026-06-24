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
        Schema::create('applications', function (Blueprint $table) {
            $table->id('application_id');
            $table->foreignId('user_id')->references('user_id')->on('users')->cascadeOnDelete();
            $table->foreignId('company_id')->references('company_id')->on('companies')->cascadeOnDelete();

            $table->string('job_title');
            $table->string('job_type')->nullable(); 
            // Full-time, Part-time, Internship, Contract, Remote

            $table->string('work_setup')->nullable(); 
            // On-site, Hybrid, Remote

            $table->string('location')->nullable();

            $table->decimal('salary_min', 10, 2)->nullable();
            $table->decimal('salary_max', 10, 2)->nullable();
            $table->string('currency')->default('PHP');

            $table->string('status')->default('applied');
            // saved, applied, screening, interview, offer, rejected, withdrawn, hired

            $table->date('applied_date')->nullable();
            $table->date('deadline')->nullable();

            $table->string('job_post_url')->nullable();
            $table->text('job_description')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('applications');
    }
};
