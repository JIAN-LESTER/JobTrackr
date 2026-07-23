<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const STATUSES = [
        'saved',
        'applied',
        'final_interview',
        'interview',
        'ghosted',
        'closed',
        'offer_declined',
        'offered_another_position',
        'offer',
        'rejected',
        'hired',
    ];

    private const LEGACY_STATUSES = [
        'saved',
        'applied',
        'assessment',
        'screening',
        'final_interview',
        'interviewing',
        'position_filled_in',
        'ghosted',
        'closed',
        'offer_declined',
        'awaiting_client_offer',
        'contract_signing',
        'awaiting_interview_with_hr',
        'offereed_another_position',
        'initial_interview',
        'offer',
        'rejected',
        'withdrawn',
        'hired',
    ];

    private const LEGACY_STATUS_MAP = [
        'assessment' => 'interview',
        'screening' => 'interview',
        'interviewing' => 'interview',
        'position_filled_in' => 'closed',
        'awaiting_client_offer' => 'offer',
        'contract_signing' => 'offer',
        'awaiting_interview_with_hr' => 'interview',
        'offereed_another_position' => 'offered_another_position',
        'initial_interview' => 'interview',
        'withdrawn' => 'closed',
    ];

    private const ROLLBACK_STATUS_MAP = [
        'interview' => 'interviewing',
        'offered_another_position' => 'offereed_another_position',
    ];

    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check');
        }

        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE applications MODIFY status VARCHAR(255) NOT NULL DEFAULT 'applied'");
        }

        foreach (self::LEGACY_STATUS_MAP as $legacyStatus => $status) {
            DB::table('applications')
                ->where('status', $legacyStatus)
                ->update(['status' => $status]);
        }

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE applications ADD CONSTRAINT applications_status_check CHECK (status IN ('.$this->quotedStatuses(self::STATUSES).'))');
        }

        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            DB::statement('ALTER TABLE applications MODIFY status ENUM('.$this->quotedStatuses(self::STATUSES).") NOT NULL DEFAULT 'applied'");
        }
    }

    public function down(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check');
        }

        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE applications MODIFY status VARCHAR(255) NOT NULL DEFAULT 'applied'");
        }

        foreach (self::ROLLBACK_STATUS_MAP as $status => $legacyStatus) {
            DB::table('applications')
                ->where('status', $status)
                ->update(['status' => $legacyStatus]);
        }

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE applications ADD CONSTRAINT applications_status_check CHECK (status IN ('.$this->quotedStatuses(self::LEGACY_STATUSES).'))');
        }

        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            DB::statement('ALTER TABLE applications MODIFY status ENUM('.$this->quotedStatuses(self::LEGACY_STATUSES).") NOT NULL DEFAULT 'applied'");
        }
    }

    /** @param array<int, string> $statuses */
    private function quotedStatuses(array $statuses): string
    {
        return collect($statuses)
            ->map(fn (string $status) => DB::getPdo()->quote($status))
            ->implode(', ');
    }
};
