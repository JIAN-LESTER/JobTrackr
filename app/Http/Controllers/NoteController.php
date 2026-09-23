<?php

namespace App\Http\Controllers;

use App\Models\Note;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class NoteController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        $search = $request->input('search');
        $perPage = max(1, min((int) $request->input('per_page', 10), 100));

        $notes = Note::query()
            ->with(['jobApplication.company', 'user'])
            ->whereHas('jobApplication', fn ($query) => $query->where('user_id', $request->user()->getKey()))
            ->when($search, function ($query, $search) {
                $query->where('content', 'like', "%{$search}%");
            })
            ->when($request->filled('job_application_id'), fn ($query) => $query->where('job_application_id', $request->input('job_application_id')))
            ->when($request->filled('user_id'), fn ($query) => $query->where('user_id', $request->input('user_id')))
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('notes/index', [
            'notes' => $notes,
            'filters' => $request->only([
                'search',
                'job_application_id',
                'user_id',
                'per_page',
            ]),
        ]);
    }

    public function show(Note $note): JsonResponse
    {
        $this->authorizeNote($note);

        return response()->json($note->load(['jobApplication.company', 'user']));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validatedData($request);
        $data['user_id'] = $request->user()->getKey();

        $note = Note::create($data);

        Log::info('Application note created.', ['user_id' => $request->user()->getKey(), 'note_id' => $note->getKey()]);

        return response()->json([
            'message' => 'Note created.',
            'note' => $note->load(['jobApplication.company', 'user']),
        ], 201);
    }

    public function update(Request $request, Note $note): JsonResponse
    {
        $this->authorizeNote($note);
        $note->update($this->validatedData($request, true));

        Log::info('Application note updated.', ['user_id' => $request->user()->getKey(), 'note_id' => $note->getKey()]);

        return response()->json([
            'message' => 'Note updated.',
            'note' => $note->fresh(['jobApplication.company', 'user']),
        ]);
    }

    public function destroy(Note $note): Response
    {
        $this->authorizeNote($note);
        $note->delete();

        Log::info('Application note deleted.', ['user_id' => request()->user()->getKey(), 'note_id' => $note->getKey()]);

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
            'content' => [$required, 'string'],
        ]);
    }

    private function authorizeNote(Note $note): void
    {
        $owned = $note->jobApplication()->where('user_id', request()->user()->getKey())->exists();

        if (! $owned) {
            Log::warning('Unauthorized application note access blocked.', [
                'user_id' => request()->user()->getKey(),
                'note_id' => $note->getKey(),
            ]);
        }

        abort_unless($owned, 404);
    }
}
