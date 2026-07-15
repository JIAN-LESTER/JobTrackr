<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Application extends Model
{
    use SoftDeletes;

    protected $primaryKey = 'application_id';

    protected $fillable = [
        'user_id',
        'company_id',
        'job_title',
        'job_type',
        'work_setup',
        'location',
        'salary_min',
        'salary_max',
        'status',
        'applied_date',
        'job_post_url',
        'job_description',
    ];

    protected $casts = [
        'applied_date' => 'date',
        'salary_min' => 'decimal:2',
        'salary_max' => 'decimal:2',
    ];

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    /** @return BelongsTo<Company, $this> */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_id', 'company_id');
    }

    /** @return HasMany<Interview, $this> */
    public function interviews(): HasMany
    {
        return $this->hasMany(Interview::class, 'job_application_id', 'application_id');
    }

    /** @return HasMany<ApplicationStatusHistory, $this> */
    public function statusHistories(): HasMany
    {
        return $this->hasMany(ApplicationStatusHistory::class, 'job_application_id', 'application_id');
    }

    /** @return HasMany<ApplicationContact, $this> */
    public function contacts(): HasMany
    {
        return $this->hasMany(ApplicationContact::class, 'job_application_id', 'application_id');
    }

    /** @return HasMany<Document, $this> */
    public function documents(): HasMany
    {
        return $this->hasMany(Document::class, 'job_application_id', 'application_id');
    }

    /** @return HasMany<Note, $this> */
    public function notes(): HasMany
    {
        return $this->hasMany(Note::class, 'job_application_id', 'application_id');
    }

    /** @return HasMany<Reminder, $this> */
    public function reminders(): HasMany
    {
        return $this->hasMany(Reminder::class, 'job_application_id', 'application_id');
    }

    /** @return HasMany<ResumeAnalysis, $this> */
    public function resumeAnalyses(): HasMany
    {
        return $this->hasMany(ResumeAnalysis::class, 'job_application_id', 'application_id');
    }
}
