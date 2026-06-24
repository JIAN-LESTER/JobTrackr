<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reminder extends Model
{
    protected $fillable = [
        'job_application_id',
        'title',
        'description',
        'remind_at',
        'is_completed',
    ];

    protected $casts = [
        'remind_at' => 'datetime',
        'is_completed' => 'boolean',
    ];

    public function jobApplication()
    {
        return $this->belongsTo(Application::class);
    }
}
