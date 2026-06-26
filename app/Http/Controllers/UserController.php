<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $perPage = max(1, min((int) $request->input('per_page', 10), 100));

        $users = User::query()
            ->when($search, function ($query, $search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($request->has('email_verified'), function ($query) use ($request) {
                $request->boolean('email_verified')
                    ? $query->whereNotNull('email_verified_at')
                    : $query->whereNull('email_verified_at');
            })
            ->when($request->filled('created_from'), fn ($query) => $query->whereDate('created_at', '>=', $request->input('created_from')))
            ->when($request->filled('created_to'), fn ($query) => $query->whereDate('created_at', '<=', $request->input('created_to')))
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('users/index', [
            'users' => $users,
            'filters' => $request->only([
                'search',
                'email_verified',
                'created_from',
                'created_to',
                'per_page',
            ]),
        ]);
    }

    public function show(User $user)
    {
        return response()->json($user);
    }

    public function store(Request $request)
    {
        $user = User::create($request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
        ]));

        return response()->json([
            'message' => 'User created.',
            'user' => $user,
        ], 201);
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->getKey(), $user->getKeyName()),
            ],
            'password' => ['sometimes', 'string', 'min:8'],
        ]);

        $user->update($data);

        return response()->json([
            'message' => 'User updated.',
            'user' => $user->fresh(),
        ]);
    }

    public function destroy(User $user)
    {
        $user->delete();

        return response()->noContent();
    }
}
