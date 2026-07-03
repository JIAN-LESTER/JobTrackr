<?php

namespace App\Http\Controllers;

use App\Models\Note;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
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
        return response()->json($note->load(['jobApplication.company', 'user']));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validatedData($request);
        $data['user_id'] = $data['user_id'] ?? $request->user()->getKey();

        $note = Note::create($data);

        return response()->json([
            'message' => 'Note created.',
            'note' => $note->load(['jobApplication.company', 'user']),
        ], 201);
    }

    public function update(Request $request, Note $note): JsonResponse
    {
        $note->update($this->validatedData($request, true));

        return response()->json([
            'message' => 'Note updated.',
            'note' => $note->fresh(['jobApplication.company', 'user']),
        ]);
    }

    public function destroy(Note $note): Response
    {
        $note->delete();

        return response()->noContent();
    }

    /** @return array<string, mixed> */
    private function validatedData(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'job_application_id' => [$required, 'integer', 'exists:applications,application_id'],
            'user_id' => ['nullable', 'integer', 'exists:users,user_id'],
            'content' => [$required, 'string'],
        ]);
    }
}
