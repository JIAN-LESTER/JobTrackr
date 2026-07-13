<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class TrustedProxyTest extends TestCase
{
    public function test_forwarded_https_proxy_headers_are_used_for_generated_urls(): void
    {
        Route::get('/proxy-url-check', fn () => [
            'login_url' => route('login'),
        ]);

        $response = $this
            ->withServerVariables([
                'REMOTE_ADDR' => '10.0.0.1',
                'HTTP_HOST' => 'jobtrackr-sglu.onrender.com',
                'HTTP_X_FORWARDED_HOST' => 'jobtrackr-sglu.onrender.com',
                'HTTP_X_FORWARDED_PORT' => '443',
                'HTTP_X_FORWARDED_PROTO' => 'https',
            ])
            ->get('/proxy-url-check');

        $response
            ->assertOk()
            ->assertJson([
                'login_url' => 'https://jobtrackr-sglu.onrender.com/login',
            ]);
    }
}
