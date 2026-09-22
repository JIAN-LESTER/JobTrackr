<?php

namespace App\Http\Controllers;

use App\Models\ApplicationContact;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class ApplicationContactController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        $search = $request->input('search');
        $perPage = max(1, min((int) $request->input('per_page', 10), 100));

        $contacts = ApplicationContact::query()
            ->with('jobApplication.company')
            ->whereHas('jobApplication', fn ($query) => $query->where('user_id', $request->user()->getKey()))
            ->when($search, function ($query, $search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('position', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('linkedin_url', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('job_application_id'), fn ($query) => $query->where('job_application_id', $request->input('job_application_id')))
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('contacts/index', [
            'contacts' => $contacts,
            'filters' => $request->only([
                'search',
                'job_application_id',
                'per_page',
            ]),
        ]);
    }

    public function show(ApplicationContact $contact): JsonResponse
    {
        $this->authorizeContact($contact);

        return response()->json($contact->load('jobApplication.company'));
    }

    public function store(Request $request): JsonResponse
    {
        $contact = ApplicationContact::create($this->validatedData($request));

        Log::info('Application contact created.', ['user_id' => $request->user()->getKey(), 'contact_id' => $contact->getKey()]);

        return response()->json([
            'message' => 'Contact created.',
            'contact' => $contact->load('jobApplication.company'),
        ], 201);
    }

    public function update(Request $request, ApplicationContact $contact): JsonResponse
    {
        $this->authorizeContact($contact);
        $contact->update($this->validatedData($request, true));

        Log::info('Application contact updated.', ['user_id' => $request->user()->getKey(), 'contact_id' => $contact->getKey()]);

        return response()->json([
            'message' => 'Contact updated.',
            'contact' => $contact->fresh('jobApplication.company'),
        ]);
    }

    public function destroy(ApplicationContact $contact): Response
    {
        $this->authorizeContact($contact);
        $contact->delete();

        Log::info('Application contact deleted.', ['user_id' => request()->user()->getKey(), 'contact_id' => $contact->getKey()]);

        return response()->noContent();
    }

    /** @return array<string, mixed> */
    private function validatedData(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'job_application_id' => [
                $required,
                'integer',
                Rule::exists('applications', 'application_id')->where('user_id', $request->user()->getKey()),
            ],
            'name' => [$required, 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'linkedin_url' => ['nullable', 'url', 'max:255'],
        ]);
    }

    private function authorizeContact(ApplicationContact $contact): void
    {
        $owned = $contact->jobApplication()->where('user_id', request()->user()->getKey())->exists();

        if (! $owned) {
            Log::warning('Unauthorized application contact access blocked.', [
                'user_id' => request()->user()->getKey(),
                'contact_id' => $contact->getKey(),
            ]);
        }

        abort_unless($owned, 404);
    }
}
