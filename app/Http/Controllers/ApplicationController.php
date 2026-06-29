<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\Company;
use App\Models\Log;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class ApplicationController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $perPage = max(1, min((int) $request->input('per_page', 10), 100));
        $userId = $request->user()->getKey();

        $statusCounts = Application::query()
            ->where('user_id', $userId)
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $applications = Application::query()
            ->with(['company', 'user'])
            ->where('user_id', $userId)
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
            'stats' => [
                'total' => (int) $statusCounts->sum(),
                'applied' => (int) ($statusCounts['applied'] ?? 0),
                'interviewing' => (int) collect([
                    'initial_interview',
                    'interviewing',
                    'final_interview',
                    'awaiting_interview_with_hr',
                ])->sum(fn ($status) => $statusCounts[$status] ?? 0),
                'offers' => (int) collect([
                    'offer',
                    'awaiting_client_offer',
                    'contract_signing',
                    'hired',
                ])->sum(fn ($status) => $statusCounts[$status] ?? 0),
            ],
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

  public function import(Request $request)
{
    if ($request->isMethod('post') && $request->filled('extracted', false) !== null && $request->has('company')) {
        return Inertia::render('ApplicationImport', [
            'importData' => $this->importDataFromExtension($request),
        ]);
    }

    $url = $request->input('url');

    return Inertia::render('ApplicationImport', [
        'importData' => $this->extractImportedJobData(is_string($url) ? $url : null),
    ]);
}

private function importDataFromExtension(Request $request): array
{
    return [
        'url' => $request->input('url'),
        'company' => $this->cleanText($request->input('company')) ?: 'Imported',
        'job_title' => $this->cleanText($request->input('job_title')) ?: 'Imported job',
        'location' => $this->cleanText($request->input('location')),
        'job_type' => $this->cleanText($request->input('job_type')),
        'work_setup' => $this->cleanText($request->input('work_setup')),
        'salary_min' => $request->input('salary_min') ?: null,
        'salary_max' => $request->input('salary_max') ?: null,
        'job_description' => $this->cleanText($request->input('job_description')),
    ];
}

    public function store(Request $request)
    {
        $data = $request->validate([
            'company' => ['required', 'string', 'max:255'],
            'company_industry' => ['nullable', 'string', 'max:255'],
            'job_title' => ['required', 'string', 'max:255'],
            'job_type' => ['nullable', 'string', 'max:255'],
            'work_setup' => ['nullable', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'salary_min' => ['nullable', 'numeric', 'min:0'],
            'salary_max' => ['nullable', 'numeric', 'min:0'],
            'status' => ['required', 'string', 'max:255'],
            'applied_date' => ['nullable', 'date'],
            'job_post_url' => ['nullable', 'url', 'max:255'],
            'job_description' => ['nullable', 'string'],
            'import_url_only' => ['sometimes', 'boolean'],
        ]);

        if (($data['import_url_only'] ?? false) && ! empty($data['job_post_url'])) {
            $importData = $this->extractImportedJobData($data['job_post_url']);

            $data = array_merge($data, [
                'company' => $importData['company'] ?? $data['company'],
                'job_title' => $importData['job_title'] ?? $data['job_title'],
                'job_type' => $importData['job_type'] ?? $data['job_type'] ?? null,
                'work_setup' => $importData['work_setup'] ?? $data['work_setup'] ?? null,
                'location' => $importData['location'] ?? $data['location'] ?? null,
                'salary_min' => $importData['salary_min'] ?? $data['salary_min'] ?? null,
                'salary_max' => $importData['salary_max'] ?? $data['salary_max'] ?? null,
                'job_description' => $importData['job_description'] ?? $data['job_description'] ?? null,
            ]);
        }

        $companyName = trim($data['company']);

        if ($companyName === '') {
            return back()->withErrors([
                'company' => 'The company field is required.',
            ])->withInput();
        }

        $company = Company::firstOrCreate([
            'name' => $companyName,
        ]);
        $company->fill([
            'industry' => $data['company_industry'] ?? $company->industry,
        ])->save();

        $application = Application::create([
            'user_id' => $request->user()->getKey(),
            'company_id' => $company->getKey(),
            'job_title' => $data['job_title'],
            'job_type' => $data['job_type'] ?? null,
            'work_setup' => $data['work_setup'] ?? null,
            'location' => $data['location'] ?? null,
            'salary_min' => $data['salary_min'] ?? null,
            'salary_max' => $data['salary_max'] ?? null,
            'status' => $data['status'],
            'applied_date' => $data['applied_date'] ?? null,
            'job_post_url' => $data['job_post_url'] ?? null,
            'job_description' => $data['job_description'] ?? null,
        ]);

        if ($request->header('X-Inertia')) {
            return back();
        }

        Log::create([
            'user_id' => $request->user()->getKey(),
            'action' => 'Created application for job title: ' . $application->job_title,
            'type' => 'application',
        ]);

        return response()->json([
            'message' => 'Application created.',
            'application' => $application->load(['company', 'user']),
        ], 201);
    }

    public function update(Request $request, Application $application)
    {
        $this->authorizeApplication($application);

        $data = $request->validate([
            'company' => ['sometimes', 'required', 'string', 'max:255'],
            'company_industry' => ['nullable', 'string', 'max:255'],
            'company_id' => ['sometimes', 'integer', 'exists:companies,company_id'],
            'job_title' => ['sometimes', 'required', 'string', 'max:255'],
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

        if (array_key_exists('company', $data)) {
            $companyName = trim($data['company']);

            if ($companyName === '') {
                return back()->withErrors([
                    'company' => 'The company field is required.',
                ])->withInput();
            }

            $company = Company::firstOrCreate([
                'name' => $companyName,
            ]);
            $company->fill([
                'industry' => $data['company_industry'] ?? $company->industry,
            ])->save();

            $data['company_id'] = $company->getKey();
        }

        unset($data['company'], $data['company_industry']);

        $application->update($data);

        Log::create([
            'user_id' => $request->user()->getKey(),
            'action' => 'Updated application for job title: ' . $application->job_title,
            'type' => 'application',
        ]);

        if ($request->header('X-Inertia')) {
            return back();
        }

        return response()->json([
            'message' => 'Application updated.',
            'application' => $application->fresh(['company', 'user']),
        ]);
    }

    public function destroy(Application $application)
    {
        $this->authorizeApplication($application);

        $application->delete();

        if (request()->header('X-Inertia')) {
            return back();
        }

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

    private function extractImportedJobData(?string $url): array
    {
        $data = [
            'url' => $url,
            'company' => 'Imported',
            'job_title' => 'Imported job',
            'location' => null,
            'job_type' => null,
            'work_setup' => null,
            'salary_min' => null,
            'salary_max' => null,
            'job_description' => null,
        ];

        if (! $url || ! filter_var($url, FILTER_VALIDATE_URL)) {
            return $data;
        }

        try {
            $response = Http::timeout(8)
                ->withHeaders(['User-Agent' => 'JobTrackr/1.0'])
                ->get($url);
        } catch (\Throwable) {
            return $data;
        }

        if (! $response->successful()) {
            return $data;
        }

        $html = $response->body();
        $document = new \DOMDocument();
        libxml_use_internal_errors(true);
        $document->loadHTML($html);
        libxml_clear_errors();

        $xpath = new \DOMXPath($document);
        $jobPosting = $this->jobPostingFromJsonLd($xpath);
        $title = $jobPosting['title'] ?? $this->metaContent($xpath, 'property', 'og:title') ?? $this->pageTitle($xpath);
        $company = $jobPosting['hiringOrganization']['name'] ?? $this->metaContent($xpath, 'property', 'og:site_name');
        $description = $jobPosting['description'] ?? $this->metaContent($xpath, 'name', 'description');
        $salary = $jobPosting['baseSalary']['value'] ?? null;
        $salaryValue = is_array($salary) ? ($salary['value'] ?? null) : $salary;

        return array_merge($data, [
            'company' => $this->cleanText($company) ?: $data['company'],
            'job_title' => $this->cleanText($title) ?: $data['job_title'],
            'location' => $this->locationFromJobPosting($jobPosting),
            'job_type' => $this->cleanText($jobPosting['employmentType'] ?? null),
            'work_setup' => ($jobPosting['jobLocationType'] ?? null) === 'TELECOMMUTE' ? 'Remote' : null,
            'salary_min' => is_array($salary) ? ($salary['minValue'] ?? $salaryValue) : $salaryValue,
            'salary_max' => is_array($salary) ? ($salary['maxValue'] ?? $salaryValue) : $salaryValue,
            'job_description' => $this->cleanText($description),
        ]);
    }

    private function jobPostingFromJsonLd(\DOMXPath $xpath): array
    {
        foreach ($xpath->query('//script[@type="application/ld+json"]') as $script) {
            $decoded = json_decode($script->textContent, true);

            foreach ($this->jsonLdItems($decoded) as $item) {
                $type = $item['@type'] ?? null;
                $types = is_array($type) ? $type : [$type];

                if (in_array('JobPosting', $types, true)) {
                    return $item;
                }
            }
        }

        return [];
    }

    private function jsonLdItems(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        $items = array_is_list($value) ? $value : [$value];

        foreach ($items as $item) {
            if (isset($item['@graph']) && is_array($item['@graph'])) {
                $items = array_merge($items, $item['@graph']);
            }
        }

        return array_filter($items, fn ($item) => is_array($item));
    }

    private function locationFromJobPosting(array $jobPosting): ?string
    {
        $location = $jobPosting['jobLocation'] ?? null;
        $location = is_array($location) && array_is_list($location) ? ($location[0] ?? null) : $location;
        $address = is_array($location) ? ($location['address'] ?? $location) : null;

        if (! is_array($address)) {
            return $this->cleanText($location);
        }

        return $this->cleanText(implode(', ', array_filter([
            $address['addressLocality'] ?? null,
            $address['addressRegion'] ?? null,
            $address['addressCountry'] ?? null,
        ])));
    }

    private function metaContent(\DOMXPath $xpath, string $attribute, string $value): ?string
    {
        $nodes = $xpath->query("//meta[@{$attribute}='{$value}']/@content");

        return $nodes->length ? $nodes->item(0)->nodeValue : null;
    }

    private function pageTitle(\DOMXPath $xpath): ?string
    {
        $nodes = $xpath->query('//title');

        return $nodes->length ? $nodes->item(0)->textContent : null;
    }

    private function cleanText(mixed $value): ?string
    {
        if (! is_scalar($value)) {
            return null;
        }

        $text = trim(preg_replace('/\s+/', ' ', html_entity_decode(strip_tags((string) $value))));

        return $text === '' ? null : mb_substr($text, 0, 5000);
    }

    private function authorizeApplication(Application $application): void
    {
        abort_unless((string) $application->user_id === (string) request()->user()->getKey(), 404);
    }
}
