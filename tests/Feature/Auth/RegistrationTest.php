<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Fortify\Features;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->skipUnlessFortifyHas(Features::registration());
    }

    public function test_registration_screen_can_be_rendered()
    {
        $response = $this->get(route('register'));

        $response->assertOk();
    }

    public function test_new_users_can_register()
    {
        $response = $this->post(route('register.store'), [
            'email' => 'test@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect('/applications');
    }

    public function test_users_cannot_register_with_a_taken_email()
    {
        User::factory()->create([
            'email' => 'test@example.com',
        ]);

        $response = $this->post(route('register.store'), [
            'email' => 'test@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $this->assertGuest();
        $response->assertSessionHasErrors([
            'email' => 'This email is already taken.',
        ]);
        $this->assertDatabaseCount('users', 1);
    }

    public function test_users_cannot_register_with_invalid_input()
    {
        $response = $this->post(route('register.store'), [
            'email' => 'not an email',
            'password' => 'short',
            'password_confirmation' => 'different',
        ]);

        $this->assertGuest();
        $response->assertSessionHasErrors(['email', 'password']);
        $this->assertDatabaseCount('users', 0);
    }

    public function test_registration_normalizes_email_before_saving()
    {
        $response = $this->post(route('register.store'), [
            'email' => ' TEST@EXAMPLE.COM ',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect('/applications');
        $this->assertDatabaseHas('users', [
            'name' => 'test',
            'email' => 'test@example.com',
        ]);
    }
}
