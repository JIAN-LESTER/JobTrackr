<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Note extends Model
{
    use SoftDeletes;

    protected $primaryKey = 'note_id';

    protected $fillable = [
        'job_application_id',
        'user_id',
        'content',
    ];

    public function jobApplication()
    {
        return $this->belongsTo(Application::class, 'job_application_id', 'application_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}
