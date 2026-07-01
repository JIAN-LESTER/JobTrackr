<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OnboardingWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_complete_onboarding(): void
    {
        $user = User::factory()->create(['onboarding_completed_at' => null]);

        $this->actingAs($user)
            ->post(route('onboarding.update'), [
                'first_name' => 'Job',
                'last_name' => 'Seeker',
                'industry' => 'Technology',
                'job_title' => 'Software Engineer',
                'location' => 'Manila',
                'education_school' => 'State University',
                'education_degree' => 'BS',
                'education_program' => 'Computer Science',
            ])
            ->assertRedirect('/applications');

        $user->refresh();

        $this->assertSame('Job Seeker', $user->name);
        $this->assertSame('Technology', $user->industry);
        $this->assertNotNull($user->onboarding_completed_at);
    }
}
