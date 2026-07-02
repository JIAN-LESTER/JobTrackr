<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Support\AvatarPresets;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function edit(Request $request): Response|RedirectResponse
    {
        if ($request->user()->onboarding_completed_at) {
            return redirect('/applications');
        }

        return Inertia::render('Onboarding', [
            'user' => $request->user(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'industry' => ['required', 'string', 'max:255'],
            'job_title' => ['required', 'string', 'max:255'],
            'location' => ['required', 'string', 'max:255'],
            'education_school' => ['required', 'string', 'max:255'],
            'education_degree' => ['required', 'string', 'max:255'],
            'education_program' => ['required', 'string', 'max:255'],
            'avatar_preset' => ['nullable', 'string', 'in:'.implode(',', AvatarPresets::keys())],
            'photo' => ['nullable', 'image', 'max:2048'],
        ]);

        $user = $request->user();
        $data = collect($validated)->except('photo', 'first_name', 'last_name');

        if (! Schema::hasColumn('users', 'avatar_preset')) {
            $data->forget('avatar_preset');
        }

        $user->fill($data->all());
        if ($request->hasFile('photo') && Schema::hasColumn('users', 'avatar_preset')) {
            $user->avatar_preset = null;
        }
        $user->name = trim($validated['first_name'].' '.$validated['last_name']);
        $user->onboarding_completed_at = now();
        $user->save();

        $this->storePhoto($user->getKey(), $request->file('photo'));

        return redirect('/applications');
    }

    private function storePhoto(int|string $userId, ?UploadedFile $file): void
    {
        if (! $file) {
            return;
        }

        $path = $file->store("users/{$userId}/documents", 'public');

        Document::create([
            'user_id' => $userId,
            'document_type' => 'photo',
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'mime_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
        ]);
    }
}
