<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        $input['email'] = Str::lower(trim((string) Arr::get($input, 'email', '')));

        Validator::make($input, [
            'email' => [
                ...$this->emailRules(),
                'not_regex:/\s/',
            ],
            'password' => $this->passwordRules(),
        ], [
            'email.not_regex' => 'Email address cannot contain spaces.',
            'email.unique' => 'This email is already taken.',
        ])->validate();

        return User::create([
            'name' => Str::before($input['email'], '@'),
            'email' => $input['email'],
            'password' => $input['password'],
        ]);
    }
}
