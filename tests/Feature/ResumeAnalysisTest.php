<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ResumeAnalysisTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_analyze_a_resume_and_save_the_result_to_an_application(): void
    {
        config()->set('ai.resume_analyzer.api_key', 'test-key');
        Http::fake([
            '*' => Http::response([
                'choices' => [
                    ['message' => ['content' => json_encode([
                        'match_score' => 82,
                        'missing_technical_skills' => ['Docker'],
                        'relevant_skills_present' => ['Laravel'],
                        'keyword_recommendations' => ['REST APIs'],
                        'experience_and_project_alignment' => ['Relevant web application work.'],
                        'weak_or_unclear_sections' => ['Projects need outcomes.'],
                        'suggested_bullet_point_improvements' => ['Quantify the impact of the Laravel project.'],
                    ])]],
                ],
            ]),
        ]);

        $user = User::factory()->create(['onboarding_completed_at' => now()]);
        $application = $this->applicationFor($user);

        $this->actingAs($user)
            ->withHeader('Accept', 'application/json')
            ->post(route('resume-analyses.store'), [
                'job_source' => 'custom',
                'job_application_id' => $application->application_id,
                'job_description' => 'Laravel developer with REST API experience.',
                'resume_source' => 'upload',
                'resume_file' => UploadedFile::fake()->createWithContent('resume.txt', 'Laravel developer with several REST API projects.'),
            ])
            ->assertCreated()
            ->assertJsonPath('analysis.match_score', 82)
            ->assertJsonPath('analysis.analysis.missing_technical_skills.0', 'Docker');

        $this->assertDatabaseHas('resume_analyses', [
            'user_id' => $user->user_id,
            'job_application_id' => $application->application_id,
            'match_score' => 82,
        ]);
        $this->assertDatabaseHas('documents', [
            'job_application_id' => $application->application_id,
            'document_type' => 'resume',
            'file_name' => 'resume.txt',
        ]);
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
