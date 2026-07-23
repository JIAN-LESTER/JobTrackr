<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\ApplicationContact;
use App\Models\ApplicationStatusHistory;
use App\Models\Company;
use App\Models\Interview;
use App\Models\Log;
use App\Models\Note;
use App\Models\Reminder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RelatedRecordsWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_contact_interview_note_reminder_and_timeline_records_can_be_managed(): void
    {
        $user = User::factory()->create(['onboarding_completed_at' => now()]);
        $application = $this->applicationFor($user);
        $this->actingAs($user);

        $this->postJson(route('contacts.store'), [
            'job_application_id' => $application->application_id,
            'name' => 'Jane Recruiter',
            'position' => 'Recruiter',
            'email' => 'jane@example.com',
            'linkedin_url' => 'https://linkedin.com/in/jane',
        ])->assertCreated()
            ->assertJsonPath('contact.name', 'Jane Recruiter');
        $contact = ApplicationContact::firstOrFail();
        $this->patchJson(route('contacts.update', $contact), ['phone' => '+639171234567'])->assertOk();
        $this->deleteJson(route('contacts.destroy', $contact))->assertNoContent();
        $this->assertSoftDeleted('application_contacts', ['id' => $contact->id]);

        $this->postJson(route('interviews.store'), [
            'job_application_id' => $application->application_id,
            'interview_type' => 'Technical',
            'scheduled_at' => now()->addDay()->toDateTimeString(),
            'meeting_link' => 'https://example.com/meeting',
            'status' => 'scheduled',
        ])->assertCreated()
            ->assertJsonPath('interview.interview_type', 'Technical');
        $interview = Interview::firstOrFail();
        $this->patchJson(route('interviews.update', $interview), ['status' => 'completed'])->assertOk();
        $this->deleteJson(route('interviews.destroy', $interview))->assertNoContent();
        $this->assertSoftDeleted('interviews', ['interview_id' => $interview->interview_id]);

        $this->postJson(route('notes.store'), [
            'job_application_id' => $application->application_id,
            'content' => 'Followed up after screening.',
        ])->assertCreated()
            ->assertJsonPath('note.content', 'Followed up after screening.');
        $note = Note::firstOrFail();
        $this->patchJson(route('notes.update', $note), ['content' => 'Updated note.'])->assertOk();
        $this->deleteJson(route('notes.destroy', $note))->assertNoContent();
        $this->assertSoftDeleted('notes', ['note_id' => $note->note_id]);

        $this->postJson(route('reminders.store'), [
            'job_application_id' => $application->application_id,
            'title' => 'Send follow-up',
            'description' => 'Email recruiter',
            'remind_at' => now()->addDay()->toDateTimeString(),
        ])->assertCreated()
            ->assertJsonPath('reminder.title', 'Send follow-up');
        $reminder = Reminder::firstOrFail();
        $this->patchJson(route('reminders.update', $reminder), ['is_completed' => true])->assertOk();
        $this->deleteJson(route('reminders.destroy', $reminder))->assertNoContent();
        $this->assertSoftDeleted('reminders', ['reminder_id' => $reminder->reminder_id]);

        $this->postJson(route('status-histories.store'), [
            'job_application_id' => $application->application_id,
            'old_status' => 'applied',
            'new_status' => 'interview',
            'remarks' => 'Moved forward',
        ])->assertCreated()
            ->assertJsonPath('status_history.new_status', 'interview');
        $history = ApplicationStatusHistory::latest('id')->firstOrFail();
        $this->patchJson(route('status-histories.update', $history), ['remarks' => 'Updated remark'])->assertOk();
        $this->deleteJson(route('status-histories.destroy', $history))->assertNoContent();
        $this->assertSoftDeleted('application_status_histories', ['id' => $history->id]);
    }

    public function test_log_show_and_delete_are_limited_to_the_owner(): void
    {
        $user = User::factory()->create(['onboarding_completed_at' => now()]);
        $other = User::factory()->create([
            'email' => 'other@example.com',
            'onboarding_completed_at' => now(),
        ]);
        $log = Log::create([
            'user_id' => $user->user_id,
            'action' => 'Created application',
        ]);

        $this->actingAs($other)
            ->getJson(route('logs.show', $log))
            ->assertNotFound();

        $this->actingAs($user)
            ->getJson(route('logs.show', $log))
            ->assertOk()
            ->assertJsonPath('action', 'Created application');

        $this->deleteJson(route('logs.destroy', $log))->assertNoContent();
        $this->assertSoftDeleted('logs', ['log_id' => $log->log_id]);
    }

    private function applicationFor(User $user): Application
    {
        $company = Company::create(['name' => 'Acme']);

        return Application::create([
            'user_id' => $user->user_id,
            'company_id' => $company->company_id,
            'job_title' => 'Software Engineer',
            'status' => 'applied',
        ]);
    }
}
