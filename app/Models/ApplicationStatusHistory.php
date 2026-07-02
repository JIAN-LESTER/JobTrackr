<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ApplicationStatusHistory extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'job_application_id',
        'old_status',
        'new_status',
        'remarks',
    ];

    /** @return BelongsTo<Application, $this> */
    public function jobApplication(): BelongsTo
    {
        return $this->belongsTo(Application::class, 'job_application_id', 'application_id')->withTrashed();
    }
}
