<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Interview extends Model
{
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

    public function jobApplication()
    {
        return $this->belongsTo(Application::class);
    }
}
