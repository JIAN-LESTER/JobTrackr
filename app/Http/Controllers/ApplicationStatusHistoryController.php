<?php

namespace App\Http\Controllers;

use App\Models\ApplicationStatusHistory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ApplicationStatusHistoryController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $perPage = max(1, min((int) $request->input('per_page', 10), 100));

        $statusHistories = ApplicationStatusHistory::query()
            ->with('jobApplication.company')
            ->when($search, function ($query, $search) {
                $query->where(function ($query) use ($search) {
                    $query->where('old_status', 'like', "%{$search}%")
                        ->orWhere('new_status', 'like', "%{$search}%")
                        ->orWhere('remarks', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('job_application_id'), fn ($query) => $query->where('job_application_id', $request->input('job_application_id')))
            ->when($request->filled('old_status'), fn ($query) => $query->where('old_status', $request->input('old_status')))
            ->when($request->filled('new_status'), fn ($query) => $query->where('new_status', $request->input('new_status')))
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Timeline', [
            'statusHistories' => $statusHistories,
            'filters' => $request->only([
                'search',
                'job_application_id',
                'old_status',
                'new_status',
                'per_page',
            ]),
        ]);
    }

    public function show(ApplicationStatusHistory $statusHistory)
    {
        return response()->json($statusHistory->load('jobApplication.company'));
    }

    public function store(Request $request)
    {
        $statusHistory = ApplicationStatusHistory::create($this->validatedData($request));

        return response()->json([
            'message' => 'Status history created.',
            'status_history' => $statusHistory->load('jobApplication.company'),
        ], 201);
    }

    public function update(Request $request, ApplicationStatusHistory $statusHistory)
    {
        $statusHistory->update($this->validatedData($request, true));

        return response()->json([
            'message' => 'Status history updated.',
            'status_history' => $statusHistory->fresh('jobApplication.company'),
        ]);
    }

    public function destroy(ApplicationStatusHistory $statusHistory)
    {
        $statusHistory->delete();

        return response()->noContent();
    }

    private function validatedData(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'job_application_id' => [$required, 'integer', 'exists:applications,application_id'],
            'old_status' => ['nullable', 'string', 'max:255'],
            'new_status' => [$required, 'string', 'max:255'],
            'remarks' => ['nullable', 'string'],
        ]);
    }
}
