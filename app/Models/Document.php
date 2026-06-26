<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    protected $fillable = [
        'job_application_id',
        'document_type',
        'file_name',
        'file_path',
        'mime_type',
        'file_size',
    ];

    public function jobApplication()
    {
        return $this->belongsTo(Application::class);
    }
}
