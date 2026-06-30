<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'industry')) {
                $table->string('industry')->nullable()->after('location');
            }

            if (! Schema::hasColumn('users', 'education_school')) {
                $table->string('education_school')->nullable()->after('industry');
            }

            if (! Schema::hasColumn('users', 'education_degree')) {
                $table->string('education_degree')->nullable()->after('education_school');
            }

            if (! Schema::hasColumn('users', 'education_program')) {
                $table->string('education_program')->nullable()->after('education_degree');
            }

            if (! Schema::hasColumn('users', 'onboarding_completed_at')) {
                $table->timestamp('onboarding_completed_at')->nullable()->after('education_program');
            }
        });
    }

    public function down(): void
    {
        $columns = array_values(array_filter([
            'industry',
            'education_school',
            'education_degree',
            'education_program',
            'onboarding_completed_at',
        ], fn (string $column) => Schema::hasColumn('users', $column)));

        if ($columns === []) {
            return;
        }

        Schema::table('users', function (Blueprint $table) use ($columns) {
            $table->dropColumn($columns);
        });
    }
};
