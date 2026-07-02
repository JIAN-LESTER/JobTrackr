<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Reminder extends Model
{
    use SoftDeletes;

    protected $primaryKey = 'reminder_id';

    protected $fillable = [
        'job_application_id',
        'title',
        'description',
        'remind_at',
        'email_sent_at',
        'is_completed',
    ];

    protected $casts = [
        'remind_at' => 'datetime',
        'email_sent_at' => 'datetime',
        'is_completed' => 'boolean',
    ];

    public function jobApplication(): BelongsTo
    {
        return $this->belongsTo(Application::class, 'job_application_id', 'application_id');
    }
}
