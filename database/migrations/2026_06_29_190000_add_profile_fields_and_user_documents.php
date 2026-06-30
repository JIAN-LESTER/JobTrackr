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
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'job_title')) {
                $table->string('job_title')->nullable()->after('email');
            }

            if (! Schema::hasColumn('users', 'location')) {
                $table->string('location')->nullable()->after('job_title');
            }
        });

        Schema::table('documents', function (Blueprint $table) {
            if (! Schema::hasColumn('documents', 'user_id')) {
                $table->foreignId('user_id')->nullable()->after('document_id')->references('user_id')->on('users')->cascadeOnDelete();
            }

            $table->foreignId('job_application_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->foreignId('job_application_id')->nullable(false)->change();
            $table->dropConstrainedForeignId('user_id');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['job_title', 'location']);
        });
    }
};
