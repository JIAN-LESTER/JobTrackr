<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\ApplicationStatusHistory;
use App\Models\Company;
use App\Models\Log;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApplicationWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_update_view_and_delete_application(): void
    {
        $user = $this->onboardedUser();
        $this->actingAs($user);

        $this->postJson(route('applications.store'), [
            'company' => 'Acme',
            'company_industry' => 'Software',
            'job_title' => 'Software Engineer',
            'job_type' => 'Full-time',
            'work_setup' => 'Remote',
            'location' => 'Manila',
            'status' => 'applied',
            'applied_date' => '2026-07-01',
            'job_post_url' => 'https://example.com/jobs/123',
        ])->assertCreated()
            ->assertJsonPath('application.job_title', 'Software Engineer')
            ->assertJsonPath('application.company.name', 'Acme');

        $application = Application::firstOrFail();

        $this->assertDatabaseHas('companies', [
            'name' => 'Acme',
            'industry' => 'Software',
        ]);
        $this->assertDatabaseHas('application_status_histories', [
            'job_application_id' => $application->application_id,
            'new_status' => 'added',
        ]);
        $this->assertDatabaseHas('logs', [
            'user_id' => $user->user_id,
            'action' => 'Created application for job title: Software Engineer',
        ]);

        $this->patchJson(route('applications.update', $application), [
            'company' => 'Acme Labs',
            'job_title' => 'Senior Software Engineer',
            'status' => 'interviewing',
        ])->assertOk()
            ->assertJsonPath('application.job_title', 'Senior Software Engineer')
            ->assertJsonPath('application.status', 'interviewing');

        $this->assertDatabaseHas('application_status_histories', [
            'job_application_id' => $application->application_id,
            'old_status' => 'applied',
            'new_status' => 'interviewing',
        ]);

        $this->getJson(route('applications.show', $application))
            ->assertOk()
            ->assertJsonPath('job_title', 'Senior Software Engineer');

        $this->deleteJson(route('applications.destroy', $application))
            ->assertNoContent();

        $this->assertSoftDeleted('applications', [
            'application_id' => $application->application_id,
        ]);
    }

    public function test_user_cannot_view_another_users_application(): void
    {
        $owner = $this->onboardedUser();
        $other = $this->onboardedUser(['email' => 'other@example.com']);
        $application = $this->applicationFor($owner);

        $this->actingAs($other)
            ->getJson(route('applications.show', $application))
            ->assertNotFound();
    }

    public function test_application_index_company_index_and_logs_are_available(): void
    {
        $user = $this->onboardedUser();
        $this->applicationFor($user);
        Log::create([
            'user_id' => $user->user_id,
            'action' => 'Created application for job title: Software Engineer',
        ]);

        $this->actingAs($user);

        $this->get(route('applications.index'))->assertOk();
        $this->get(route('companies.index'))->assertOk();
        $this->get(route('logs.index'))->assertOk();
    }

    private function onboardedUser(array $attributes = []): User
    {
        return User::factory()->create(array_merge([
            'onboarding_completed_at' => now(),
        ], $attributes));
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
