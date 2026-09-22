<?php

namespace App\Http\Controllers;

use App\Models\Reminder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class ReminderController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        $search = $request->input('search');
        $perPage = max(1, min((int) $request->input('per_page', 10), 100));

        $reminders = Reminder::query()
            ->with('jobApplication.company')
            ->whereHas('jobApplication', fn ($query) => $query->where('user_id', $request->user()->getKey()))
            ->when($search, function ($query, $search) {
                $query->where(function ($query) use ($search) {
                    $query->where('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('job_application_id'), fn ($query) => $query->where('job_application_id', $request->input('job_application_id')))
            ->when($request->has('is_completed'), fn ($query) => $query->where('is_completed', $request->boolean('is_completed')))
            ->when($request->filled('remind_from'), fn ($query) => $query->whereDate('remind_at', '>=', $request->input('remind_from')))
            ->when($request->filled('remind_to'), fn ($query) => $query->whereDate('remind_at', '<=', $request->input('remind_to')))
            ->latest('remind_at')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Reminders', [
            'reminders' => $reminders,
            'filters' => $request->only([
                'search',
                'job_application_id',
                'is_completed',
                'remind_from',
                'remind_to',
                'per_page',
            ]),
        ]);
    }

    public function show(Reminder $reminder): JsonResponse
    {
        $this->authorizeReminder($reminder);

        return response()->json($reminder->load('jobApplication.company'));
    }

    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $reminder = Reminder::create($this->validatedData($request));

        Log::info('Reminder created.', ['user_id' => $request->user()->getKey(), 'reminder_id' => $reminder->getKey()]);

        if ($request->header('X-Inertia')) {
            Inertia::flash('toast', ['type' => 'success', 'message' => 'Reminder created.']);

            return back();
        }

        return response()->json([
            'message' => 'Reminder created.',
            'reminder' => $reminder->load('jobApplication.company'),
        ], 201);
    }

    public function update(Request $request, Reminder $reminder): JsonResponse|RedirectResponse
    {
        $this->authorizeReminder($reminder);
        $data = $this->validatedData($request, true);

        if (
            array_key_exists('remind_at', $data) &&
            ! $reminder->remind_at->equalTo(Carbon::parse($data['remind_at']))
        ) {
            $data['email_sent_at'] = null;
        }

        $reminder->update($data);

        Log::info('Reminder updated.', ['user_id' => $request->user()->getKey(), 'reminder_id' => $reminder->getKey()]);

        if ($request->header('X-Inertia')) {
            Inertia::flash('toast', ['type' => 'success', 'message' => 'Reminder updated.']);

            return back();
        }

        return response()->json([
            'message' => 'Reminder updated.',
            'reminder' => $reminder->fresh('jobApplication.company'),
        ]);
    }

    public function destroy(Reminder $reminder): JsonResponse|RedirectResponse|Response
    {
        $this->authorizeReminder($reminder);

        if (! $reminder->is_completed) {
            $reminder->update(['is_completed' => true]);

            Log::info('Reminder marked complete.', ['user_id' => request()->user()->getKey(), 'reminder_id' => $reminder->getKey()]);

            if (request()->header('X-Inertia')) {
                Inertia::flash('toast', ['type' => 'success', 'message' => 'Reminder marked done.']);

                return back();
            }

            return response()->json([
                'message' => 'Reminder marked done.',
                'reminder' => $reminder->fresh('jobApplication.company'),
            ]);
        }

        $reminder->delete();

        Log::info('Reminder deleted.', ['user_id' => request()->user()->getKey(), 'reminder_id' => $reminder->getKey()]);

        if (request()->header('X-Inertia')) {
            Inertia::flash('toast', ['type' => 'success', 'message' => 'Reminder deleted.']);

            return back();
        }

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
            'title' => [$required, 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'remind_at' => [$required, 'date'],
            'is_completed' => ['sometimes', 'boolean'],
        ]);
    }

    private function authorizeReminder(Reminder $reminder): void
    {
        $owned = $reminder->jobApplication()->where('user_id', request()->user()->getKey())->exists();

        if (! $owned) {
            Log::warning('Unauthorized reminder access blocked.', [
                'user_id' => request()->user()->getKey(),
                'reminder_id' => $reminder->getKey(),
            ]);
        }

        abort_unless($owned, 404);
    }
}
