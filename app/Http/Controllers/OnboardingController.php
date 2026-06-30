<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
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
            'industry' => ['required', 'string', 'max:255'],
            'job_title' => ['required', 'string', 'max:255'],
            'location' => ['required', 'string', 'max:255'],
            'education_school' => ['required', 'string', 'max:255'],
            'education_degree' => ['required', 'string', 'max:255'],
            'education_program' => ['required', 'string', 'max:255'],
            'photo' => ['nullable', 'image', 'max:2048'],
        ]);

        $user = $request->user();
        $user->fill(collect($validated)->except('photo')->all());
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
