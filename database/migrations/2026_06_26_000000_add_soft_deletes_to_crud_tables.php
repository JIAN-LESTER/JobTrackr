<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('applications', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('interviews', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('reminders', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('notes', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('reminders', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('interviews', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('applications', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
