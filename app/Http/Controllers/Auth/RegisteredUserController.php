<?php

namespace App\Http\Controllers\Auth;

use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\CreatesNewUsers;
use Laravel\Fortify\Contracts\RegisterViewResponse;
use Laravel\Fortify\Fortify;
use Throwable;

class RegisteredUserController extends Controller
{
    public function create(Request $request): RegisterViewResponse
    {
        return app(RegisterViewResponse::class);
    }

    public function store(Request $request, CreatesNewUsers $creator): RedirectResponse
    {
        if (config('fortify.lowercase_usernames') && $request->has(Fortify::username())) {
            $request->merge([
                Fortify::username() => Str::lower($request->{Fortify::username()}),
            ]);
        }

        $user = $creator->create($request->all());
        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        try {
            event(new Registered($user));
        } catch (ValidationException $exception) {
            Log::warning('Registration completed but verification email delivery failed.', [
                'user_id' => $user->getKey(),
            ]);

            return redirect()->route('verification.notice')->withErrors($exception->errors());
        } catch (Throwable $exception) {
            Log::error('Registration event failed unexpectedly.', [
                'user_id' => $user->getKey(),
                'exception' => $exception::class,
            ]);
            report($exception);

            return redirect()->route('verification.notice')->withErrors([
                'email' => 'Your account was created, but the verification email could not be sent. Please try again.',
            ]);
        }

        Log::info('User registered and verification email dispatched.', ['user_id' => $user->getKey()]);

        return redirect()
            ->intended(Fortify::redirects('register'));
    }
}
