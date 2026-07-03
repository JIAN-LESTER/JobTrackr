<?php

namespace App\Http\Controllers;

use App\Models\Interview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class InterviewController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        $search = $request->input('search');
        $perPage = max(1, min((int) $request->input('per_page', 10), 100));

        $interviews = Interview::query()
            ->with('jobApplication.company')
            ->when($search, function ($query, $search) {
                $query->where(function ($query) use ($search) {
                    $query->where('interview_type', 'like', "%{$search}%")
                        ->orWhere('location', 'like', "%{$search}%")
                        ->orWhere('meeting_link', 'like', "%{$search}%")
                        ->orWhere('status', 'like', "%{$search}%")
                        ->orWhere('feedback', 'like', "%{$search}%")
                        ->orWhere('notes', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('job_application_id'), fn ($query) => $query->where('job_application_id', $request->input('job_application_id')))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->input('status')))
            ->when($request->filled('interview_type'), fn ($query) => $query->where('interview_type', $request->input('interview_type')))
            ->when($request->filled('scheduled_from'), fn ($query) => $query->whereDate('scheduled_at', '>=', $request->input('scheduled_from')))
            ->when($request->filled('scheduled_to'), fn ($query) => $query->whereDate('scheduled_at', '<=', $request->input('scheduled_to')))
            ->latest('scheduled_at')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('interviews/index', [
            'interviews' => $interviews,
            'filters' => $request->only([
                'search',
                'job_application_id',
                'status',
                'interview_type',
                'scheduled_from',
                'scheduled_to',
                'per_page',
            ]),
        ]);
    }

    public function show(Interview $interview): JsonResponse
    {
        return response()->json($interview->load('jobApplication.company'));
    }

    public function store(Request $request): JsonResponse
    {
        $interview = Interview::create($this->validatedData($request));

        return response()->json([
            'message' => 'Interview created.',
            'interview' => $interview->load('jobApplication.company'),
        ], 201);
    }

    public function update(Request $request, Interview $interview): JsonResponse
    {
        $interview->update($this->validatedData($request, true));

        return response()->json([
            'message' => 'Interview updated.',
            'interview' => $interview->fresh('jobApplication.company'),
        ]);
    }

    public function destroy(Interview $interview): Response
    {
        $interview->delete();

        return response()->noContent();
    }

    /** @return array<string, mixed> */
    private function validatedData(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'job_application_id' => [$required, 'integer', 'exists:applications,application_id'],
            'interview_type' => ['nullable', 'string', 'max:255'],
            'scheduled_at' => ['nullable', 'date'],
            'location' => ['nullable', 'string', 'max:255'],
            'meeting_link' => ['nullable', 'url', 'max:255'],
            'status' => ['sometimes', 'string', 'max:255'],
            'feedback' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);
    }
}
