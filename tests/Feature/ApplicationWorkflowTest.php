<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\Company;
use App\Models\Log;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
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

    public function test_job_link_import_extracts_visible_job_description(): void
    {
        $user = $this->onboardedUser();
        $url = 'https://jobs.example.com/software-engineer';

        Http::fake([
            $url => Http::response(<<<'HTML'
                <html>
                    <head>
                        <meta property="og:title" content="Software Engineer">
                        <meta property="og:site_name" content="Acme Careers">
                        <script type="application/ld+json">
                            {
                                "@context": "https://schema.org",
                                "@type": "JobPosting",
                                "title": "Software Engineer",
                                "employmentType": "FULL_TIME",
                                "hiringOrganization": {
                                    "@type": "Organization",
                                    "name": "Acme Careers"
                                },
                                "jobLocationType": "TELECOMMUTE"
                            }
                        </script>
                    </head>
                    <body>
                        <span class="job-search-card__location">Manila, Philippines • Remote</span>
                        <div id="jobDescriptionText">
                            <p>Build Laravel and React features for customer-facing workflows.</p>
                            <h2>Responsibilities</h2>
                            <ul>
                                <li>Ship polished import flows.</li>
                                <li>Partner with product on job parsing.</li>
                            </ul>
                        </div>
                    </body>
                </html>
                HTML),
        ]);

        $this->actingAs($user)
            ->get(route('applications.import', ['url' => $url]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('ApplicationImport')
                ->where('importData.extracted', true)
                ->where('importData.company', 'Acme Careers')
                ->where('importData.job_title', 'Software Engineer')
                ->where('importData.location', 'Manila, Philippines')
                ->where('importData.job_type', 'Full-time')
                ->where('importData.work_setup', 'Remote')
                ->where('importData.job_description', "Build Laravel and React features for customer-facing workflows.\n\nResponsibilities\n\n- Ship polished import flows.\n\n- Partner with product on job parsing."),
            );
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
