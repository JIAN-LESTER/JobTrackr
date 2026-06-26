<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
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
        'currency',
        'status',
        'applied_date',
        'deadline',
        'job_post_url',
        'job_description',
        'notes',
    ];

    protected $casts = [
        'applied_date' => 'date',
        'deadline' => 'date',
        'salary_min' => 'decimal:2',
        'salary_max' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function interviews()
    {
        return $this->hasMany(Interview::class, 'job_application_id', 'application_id');
    }

    public function statusHistories()
    {
        return $this->hasMany(ApplicationStatusHistory::class, 'job_application_id', 'application_id');
    }

    public function contacts()
    {
        return $this->hasMany(ApplicationContact::class, 'job_application_id', 'application_id');
    }

    public function documents()
    {
        return $this->hasMany(Document::class, 'job_application_id', 'application_id');
    }

    public function notes()
    {
        return $this->hasMany(Note::class, 'job_application_id', 'application_id');
    }

    public function reminders()
    {
        return $this->hasMany(Reminder::class, 'job_application_id', 'application_id');
    }
}
