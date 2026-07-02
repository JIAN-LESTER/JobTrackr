<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Interview extends Model
{
    use SoftDeletes;

    protected $primaryKey = 'interview_id';

    protected $fillable = [
        'job_application_id',
        'interview_type',
        'scheduled_at',
        'location',
        'meeting_link',
        'status',
        'feedback',
        'notes',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
    ];

    /** @return BelongsTo<Application, $this> */
    public function jobApplication(): BelongsTo
    {
        return $this->belongsTo(Application::class, 'job_application_id', 'application_id');
    }
}
