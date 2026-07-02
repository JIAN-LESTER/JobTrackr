<?php

namespace App\Http\Controllers;

use App\Models\Log;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class LogController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        $search = $request->input('search');
        $perPage = max(1, min((int) $request->input('per_page', 10), 100));

        $logs = Log::query()
            ->with('user')
            ->where('user_id', $request->user()->getKey())
            ->when($search, function ($query, $search) {
                $query->where(function ($query) use ($search) {
                    $query->where('action', 'like', "%{$search}%")
                        ->orWhereHas('user', function ($query) use ($search) {
                            $query->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        });
                });
            })
            ->when($request->filled('created_from'), fn ($query) => $query->whereDate('created_at', '>=', $request->input('created_from')))
            ->when($request->filled('created_to'), fn ($query) => $query->whereDate('created_at', '<=', $request->input('created_to')))
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Audit', [
            'logs' => $logs,
            'filters' => $request->only([
                'search',
                'created_from',
                'created_to',
                'per_page',
            ]),
        ]);
    }

    public function show(Log $log): JsonResponse
    {
        $this->authorizeLog($log);

        return response()->json($log->load('user'));
    }

    public function destroy(Log $log): Response
    {
        $this->authorizeLog($log);

        $log->delete();

        return response()->noContent();
    }

    /** @return array<string, mixed> */
    private function validatedData(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'user_id' => [$required, 'integer', 'exists:users,user_id'],
            'action' => [$required, 'string', 'max:255'],
        ]);
    }

    private function authorizeLog(Log $log): void
    {
        abort_unless((string) $log->user_id === (string) request()->user()->getKey(), 404);
    }
}
