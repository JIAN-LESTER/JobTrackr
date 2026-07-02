<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Models\Document;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Database\Eloquent\Collection;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        /** @var Collection<int, Document> $documents */
        $documents = $request->user()
            ->documents()
            ->where('document_type', 'photo')
            ->latest()
            ->get()
            ->unique('document_type')
            ->values()
            ->map(fn (Document $document) => [
                'document_type' => $document->document_type,
                'file_name' => $document->file_name,
            ]);

        return Inertia::render('Profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'user' => $request->user(),
            'profileDocuments' => $documents,
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $user = $request->user();
        $data = collect($validated)->except('photo');

        if (! Schema::hasColumn('users', 'avatar_preset')) {
            $data->forget('avatar_preset');
        }

        $user->fill($data->all());
        if ($request->hasFile('photo') && Schema::hasColumn('users', 'avatar_preset')) {
            $user->avatar_preset = null;
        }

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        $this->storeProfileDocument($user->getKey(), $request->file('photo'), 'photo');

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile updated.')]);

        return to_route('profile.edit');
    }

    /**
     * Delete the user's profile.
     */
    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();

        Auth::logout();

        $user->forceDelete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    private function storeProfileDocument(int|string $userId, ?UploadedFile $file, string $type): void
    {
        if (! $file) {
            return;
        }

        $path = $file->store("users/{$userId}/documents", 'public');

        Document::create([
            'user_id' => $userId,
            'document_type' => $type,
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'mime_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
        ]);
    }
}
