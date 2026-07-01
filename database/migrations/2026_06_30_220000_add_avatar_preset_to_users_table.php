<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'avatar_preset')) {
                $table->string('avatar_preset')->nullable()->after('education_program');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('users', 'avatar_preset')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('avatar_preset');
        });
    }
};
