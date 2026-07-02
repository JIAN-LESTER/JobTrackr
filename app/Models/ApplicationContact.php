<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ApplicationContact extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'job_application_id',
        'name',
        'position',
        'email',
        'phone',
        'linkedin_url',
    ];

    public function jobApplication(): BelongsTo
    {
        return $this->belongsTo(Application::class, 'job_application_id', 'application_id');
    }
}
