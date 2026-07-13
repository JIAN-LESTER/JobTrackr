<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Fortify\Features;
use Tests\TestCase;

class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->skipUnlessFortifyHas(Features::emailVerification());
    }

    public function test_email_verification_link_survives_host_and_scheme_changes(): void
    {
        config(['app.url' => 'http://internal-service']);

        $user = User::factory()->unverified()->create();
        $url = (new VerifyEmail)->toMail($user)->actionUrl;
        $pathAndQuery = parse_url($url, PHP_URL_PATH).'?'.parse_url($url, PHP_URL_QUERY);

        $response = $this->get('https://jobtrackr-sglu.onrender.com'.$pathAndQuery);

        $response->assertRedirect(route('login'));
        $response->assertInertiaFlash('toast', [
            'type' => 'success',
            'message' => 'Email verified. You can now log in.',
        ]);
        $this->assertTrue($user->fresh()->hasVerifiedEmail());
    }
}
