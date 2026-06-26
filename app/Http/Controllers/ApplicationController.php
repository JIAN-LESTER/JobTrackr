<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\Company;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ApplicationController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $perPage = max(1, min((int) $request->input('per_page', 10), 100));

        $applications = Application::query()
            ->with(['company', 'user'])
            ->where('user_id', $request->user()->getKey())
            ->when($search, function ($query, $search) {
                $query->where(function ($query) use ($search) {
                    $query->where('job_title', 'like', "%{$search}%")
                        ->orWhere('location', 'like', "%{$search}%")
                        ->orWhere('status', 'like', "%{$search}%")
                        ->orWhereHas('company', function ($query) use ($search) {
                            $query->where('name', 'like', "%{$search}%");
                        });
                });
            })
            ->when($request->filled('company_id'), fn ($query) => $query->where('company_id', $request->input('company_id')))
            ->when($request->filled('status') && $request->input('status') !== 'all', fn ($query) => $query->where('status', $request->input('status')))
            ->when($request->filled('job_type'), fn ($query) => $query->where('job_type', $request->input('job_type')))
            ->when($request->filled('work_setup'), fn ($query) => $query->where('work_setup', $request->input('work_setup')))
            ->when($request->filled('applied_from'), fn ($query) => $query->whereDate('applied_date', '>=', $request->input('applied_from')))
            ->when($request->filled('applied_to'), fn ($query) => $query->whereDate('applied_date', '<=', $request->input('applied_to')))
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Application', [
            'applications' => $applications,
            'filters' => $request->only([
                'search',
                'user_id',
                'company_id',
                'status',
                'job_type',
                'work_setup',
                'applied_from',
                'applied_to',
                'per_page',
            ]),
            'statuses' => $this->statuses(),
        ]);
    }

    public function show(Application $application)
    {
        $this->authorizeApplication($application);

        return response()->json($application->load(['company', 'user', 'contacts', 'interviews', 'statusHistories', 'notes', 'reminders']));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'company' => ['required', 'string', 'max:255'],
            'job_title' => ['required', 'string', 'max:255'],
            'status' => ['required', 'string', 'max:255'],
            'applied_date' => ['nullable', 'date'],
        ]);

        $companyName = trim($data['company']);

        if ($companyName === '') {
            return back()->withErrors([
                'company' => 'The company field is required.',
            ])->withInput();
        }

        $company = Company::firstOrCreate([
            'name' => $companyName,
        ]);

        $application = Application::create([
            'user_id' => $request->user()->getKey(),
            'company_id' => $company->getKey(),
            'job_title' => $data['job_title'],
            'status' => $data['status'],
            'applied_date' => $data['applied_date'] ?? null,
        ]);

        if ($request->header('X-Inertia')) {
            return back();
        }

        return response()->json([
            'message' => 'Application created.',
            'application' => $application->load(['company', 'user']),
        ], 201);
    }

    public function update(Request $request, Application $application)
    {
        $this->authorizeApplication($application);

        $data = $this->validatedData($request, true);
        unset($data['user_id']);

        $application->update($data);

        return response()->json([
            'message' => 'Application updated.',
            'application' => $application->fresh(['company', 'user']),
        ]);
    }

    public function destroy(Application $application)
    {
        $this->authorizeApplication($application);

        $application->delete();

        return response()->noContent();
    }

    private function validatedData(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'user_id' => [$required, 'integer', 'exists:users,user_id'],
            'company_id' => [$required, 'integer', 'exists:companies,company_id'],
            'job_title' => [$required, 'string', 'max:255'],
            'job_type' => ['nullable', 'string', 'max:255'],
            'work_setup' => ['nullable', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'salary_min' => ['nullable', 'numeric', 'min:0'],
            'salary_max' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['sometimes', 'string', 'max:10'],
            'status' => ['sometimes', 'string', 'max:255'],
            'applied_date' => ['nullable', 'date'],
            'deadline' => ['nullable', 'date'],
            'job_post_url' => ['nullable', 'url', 'max:255'],
            'job_description' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);
    }

    private function statuses(): array
    {
        return [
            'saved',
            'applied',
            'assessment',
            'screening',
            'final_interview',
            'interviewing',
            'position_filled_in',
            'ghosted',
            'closed',
            'offer_declined',
            'awaiting_client_offer',
            'contract_signing',
            'awaiting_interview_with_hr',
            'offereed_another_position',
            'initial_interview',
            'offer',
            'rejected',
            'withdrawn',
            'hired',
        ];
    }

    private function authorizeApplication(Application $application): void
    {
        abort_unless((string) $application->user_id === (string) request()->user()->getKey(), 404);
    }
}
