<?php

namespace App\Console\Commands;

use App\Mail\ReminderDueMail;
use App\Models\Reminder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendDueReminders extends Command
{
    protected $signature = 'reminders:send-due';

    protected $description = 'Send email notifications for due reminders.';

    public function handle(): int
    {
        $sent = 0;

        Reminder::query()
            ->with(['jobApplication.company', 'jobApplication.user'])
            ->where('is_completed', false)
            ->whereNull('email_sent_at')
            ->where('remind_at', '<=', now())
            ->whereHas('jobApplication.user')
            ->chunkById(100, function ($reminders) use (&$sent) {
                foreach ($reminders as $reminder) {
                    Mail::to($reminder->jobApplication->user)->send(new ReminderDueMail($reminder));

                    $reminder->forceFill([
                        'email_sent_at' => now(),
                    ])->save();

                    $sent++;
                }
            }, 'reminder_id');

        $this->info("Sent {$sent} reminder email(s).");

        return self::SUCCESS;
    }
}
