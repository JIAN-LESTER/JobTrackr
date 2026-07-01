<?php

namespace Tests\Feature;

use App\Mail\ReminderDueMail;
use App\Models\Application;
use App\Models\Company;
use App\Models\Reminder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class SendDueRemindersTest extends TestCase
{
    use RefreshDatabase;

    public function test_due_reminders_send_email_and_are_marked_as_sent(): void
    {
        Mail::fake();

        $user = User::factory()->create();
        $company = Company::create(['name' => 'Acme']);
        $application = Application::create([
            'user_id' => $user->user_id,
            'company_id' => $company->company_id,
            'job_title' => 'Software Engineer',
            'status' => 'applied',
        ]);

        $dueReminder = Reminder::create([
            'job_application_id' => $application->application_id,
            'title' => 'Follow up',
            'remind_at' => now()->subMinute(),
            'is_completed' => false,
        ]);

        $futureReminder = Reminder::create([
            'job_application_id' => $application->application_id,
            'title' => 'Future follow up',
            'remind_at' => now()->addDay(),
            'is_completed' => false,
        ]);

        $this->artisan('reminders:send-due')
            ->expectsOutput('Sent 1 reminder email(s).')
            ->assertSuccessful();

        Mail::assertSent(ReminderDueMail::class, function (ReminderDueMail $mail) use ($dueReminder, $user) {
            return $mail->hasTo($user->email)
                && $mail->reminder->is($dueReminder);
        });

        $this->assertNotNull($dueReminder->fresh()->email_sent_at);
        $this->assertNull($futureReminder->fresh()->email_sent_at);
    }
}
