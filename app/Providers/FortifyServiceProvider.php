<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use App\Http\Controllers\Auth\RegisteredUserController as AppRegisteredUserController;
use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
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

                return redirect()->route('login');
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
        Fortify::authenticateUsing(function (Request $request): ?User {
            $email = Str::lower(trim((string) $request->input(Fortify::username(), '')));
            $user = User::query()
                ->whereRaw('LOWER(TRIM(email)) = ?', [$email])
                ->first();

            if (! $user) {
                throw ValidationException::withMessages([
                    Fortify::username() => 'An account with this email does not exist.',
                ]);
            }

            if (! Hash::check((string) $request->input('password'), $user->password)) {
                throw ValidationException::withMessages([
                    'password' => 'The provided credentials are incorrect.',
                ]);
            }

            return $user;
        });
    }

    /**
     * Configure Fortify views.
     */
    private function configureViews(): void
    {
        Fortify::loginView(fn (Request $request) => Inertia::render('auth/login', [
            'canResetPassword' => Features::enabled(Features::resetPasswords()),
            'loginErrors' => [
                'email' => $request->session()->get('errors')?->getBag('default')->first('email') ?: null,
                'password' => $request->session()->get('errors')?->getBag('default')->first('password') ?: null,
            ],
            'emailVerificationMessage' => $request->session()->get('emailVerificationMessage'),
            'status' => $request->session()->get('status'),
        ]));

        Fortify::resetPasswordView(fn (Request $request) => Inertia::render('auth/ResetPassword', [
            'email' => (string) $request->query('email', ''),
            'token' => (string) $request->route('token', ''),
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
        ]));

        Fortify::requestPasswordResetLinkView(fn (Request $request) => Inertia::render('auth/ForgotPassword', [
            'forgotPasswordErrors' => [
                'email' => $request->session()->get('errors')?->getBag('default')->first('email') ?: null,
            ],
            'status' => $request->session()->get('status'),
        ]));

        Fortify::registerView(fn (Request $request) => Inertia::render('auth/register', [
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
            'registerErrors' => [
                'email' => $request->session()->get('errors')?->getBag('default')->first('email') ?: null,
                'password' => $request->session()->get('errors')?->getBag('default')->first('password') ?: null,
                'password_confirmation' => $request->session()->get('errors')?->getBag('default')->first('password_confirmation') ?: null,
            ],
        ]));

        Fortify::verifyEmailView(function (Request $request) {
            $email = $request->user()?->email;

            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            $request->session()->flash(
                'emailVerificationMessage',
                $email
                    ? "We've sent a verification link to {$email}. Please verify your email before logging in."
                    : 'Please verify your email before logging in.'
            );

            return redirect()->route('login');
        });
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
