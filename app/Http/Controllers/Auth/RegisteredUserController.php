<?php

namespace App\Http\Controllers\Auth;

use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Laravel\Fortify\Contracts\CreatesNewUsers;
use Laravel\Fortify\Contracts\RegisterViewResponse;
use Laravel\Fortify\Fortify;

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

        event(new Registered($user = $creator->create($request->all())));

        Auth::guard('web')->login($user);

        $request->session()->regenerateToken();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Account created.']);

        return redirect()
            ->intended(Fortify::redirects('register'));
    }
}
