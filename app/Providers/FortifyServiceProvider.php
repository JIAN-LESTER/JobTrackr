<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use App\Http\Controllers\Auth\RegisteredUserController as AppRegisteredUserController;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Laravel\Fortify\Contracts\LoginResponse;
use Laravel\Fortify\Contracts\LogoutResponse;
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;
use Laravel\Fortify\Http\Controllers\RegisteredUserController as FortifyRegisteredUserController;

class FortifyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(FortifyRegisteredUserController::class, AppRegisteredUserController::class);
        $this->app->singleton(LoginResponse::class, fn () => new class implements LoginResponse
        {
            public function toResponse($request)
            {
                if ($request->wantsJson()) {
                    return response()->json(['two_factor' => false]);
                }

                Inertia::flash('toast', ['type' => 'success', 'message' => 'Logged in.']);

                return redirect()->intended(Fortify::redirects('login'));
            }
        });
        $this->app->singleton(LogoutResponse::class, fn () => new class implements LogoutResponse
        {
            public function toResponse($request)
            {
                if ($request->wantsJson()) {
                    return response()->json('', 204);
                }

                Inertia::flash('toast', ['type' => 'success', 'message' => 'Logged out.']);

                return redirect(Fortify::redirects('logout', '/'));
            }
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureActions();
        $this->configureViews();
        $this->configureRateLimiting();
    }

    /**
     * Configure Fortify actions.
     */
    private function configureActions(): void
    {
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
        Fortify::createUsersUsing(CreateNewUser::class);
    }

    /**
     * Configure Fortify views.
     */
    private function configureViews(): void
    {
        Fortify::loginView(fn (Request $request) => Inertia::render('auth/login', [
            'canResetPassword' => Features::enabled(Features::resetPasswords()),
            'status' => $request->session()->get('status'),
        ]));

        Fortify::resetPasswordView(fn (Request $request) => Inertia::render('auth/ResetPassword', [
            'email' => (string) $request->query('email', ''),
            'token' => (string) $request->route('token', ''),
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
        ]));

        Fortify::requestPasswordResetLinkView(fn (Request $request) => Inertia::render('auth/ForgotPassword', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::registerView(fn () => Inertia::render('auth/register', [
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
        ]));

        Fortify::verifyEmailView(fn (Request $request) => Inertia::render('auth/VerifyEmail', [
            'status' => $request->session()->get('status'),
        ]));
    }

    /**
     * Configure rate limiting.
     */
    private function configureRateLimiting(): void
    {
        RateLimiter::for('login', function (Request $request) {
            $throttleKey = Str::transliterate(Str::lower($request->input(Fortify::username())).'|'.$request->ip());

            return Limit::perMinute(5)->by($throttleKey);
        });
    }
}
