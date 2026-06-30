<?php

use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\ApplicationContactController;
use App\Http\Controllers\ApplicationStatusHistoryController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\InterviewController;
use App\Http\Controllers\LogController;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\ReminderController;
use App\Http\Controllers\UserController;
use App\Http\Middleware\EnsureOnboardingIsComplete;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/applications')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('onboarding', [OnboardingController::class, 'edit'])->name('onboarding.edit');
    Route::post('onboarding', [OnboardingController::class, 'update'])->name('onboarding.update');
});

Route::middleware(['auth', 'verified', EnsureOnboardingIsComplete::class])->group(function () {
    Route::redirect('dashboard', '/applications')->name('dashboard');
    Route::get('applications/import', [ApplicationController::class, 'import'])->name('applications.import');
    Route::post('/applications/import', [ApplicationController::class, 'import']);
    Route::resource('applications', ApplicationController::class)->only(['index', 'show', 'store', 'update', 'destroy']);
    Route::get('companies', [CompanyController::class, 'index'])->name('companies.index');
    Route::resource('contacts', ApplicationContactController::class)->only(['index', 'show', 'store', 'update', 'destroy']);
    Route::resource('status-histories', ApplicationStatusHistoryController::class)
        ->parameters(['status-histories' => 'statusHistory'])
        ->only(['index', 'show', 'store', 'update', 'destroy']);
    Route::resource('interviews', InterviewController::class)->only(['index', 'show', 'store', 'update', 'destroy']);
    Route::resource('logs', LogController::class)->only(['index', 'show', 'store', 'update', 'destroy']);
    Route::resource('notes', NoteController::class)->only(['index', 'show', 'store', 'update', 'destroy']);
    Route::resource('reminders', ReminderController::class)->only(['index', 'show', 'store', 'update', 'destroy']);
    Route::resource('users', UserController::class)->only(['index', 'show', 'store', 'update', 'destroy']);
});

require __DIR__.'/settings.php';
