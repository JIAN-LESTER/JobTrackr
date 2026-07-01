<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CompanyController extends Controller
{
    public function index(Request $request)
    {
        $companies = Company::query()
            ->whereHas('applications', fn ($query) => $query->where('user_id', $request->user()->getKey()))
            ->with(['applications' => fn ($query) => $query
                ->where('user_id', $request->user()->getKey())
                ->latest()
            ])
            ->withCount(['applications' => fn ($query) => $query->where('user_id', $request->user()->getKey())])
            ->orderBy('name')
            ->get();

        return Inertia::render('Company', [
            'companies' => $companies,
        ]);
    }
}
