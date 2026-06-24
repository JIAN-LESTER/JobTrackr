<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApplicationStatusHistory extends Model
{
  protected $fillable = [
        'job_application_id',
        'old_status',
        'new_status',
        'remarks',
    ];

    public function jobApplication()
    {
        return $this->belongsTo(Application::class);
    }
}
