<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApplicationContact extends Model
{
      protected $fillable = [
        'job_application_id',
        'name',
        'position',
        'email',
        'phone',
        'linkedin_url',
    ];

    public function jobApplication()
    {
        return $this->belongsTo(Application::class);
    }
}
