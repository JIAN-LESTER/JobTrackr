<?php

namespace App\Http\Controllers;

use App\Models\ApplicationStatusHistory;
use App\Models\Reminder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class ActivityController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        $userId = $request->user()->getKey();

        return Inertia::render('Activity', [
            'statusHistories' => ApplicationStatusHistory::query()
                ->with('jobApplication.company')
                ->whereHas('jobApplication', fn ($query) => $query->where('user_id', $userId))
                ->latest()
                ->paginate(12)
                ->withQueryString(),
            'reminders' => Reminder::query()
                ->with('jobApplication.company')
                ->whereHas('jobApplication', fn ($query) => $query->where('user_id', $userId))
                ->where('is_completed', false)
                ->orderBy('remind_at')
                ->limit(8)
                ->get(),
        ]);
    }
}
