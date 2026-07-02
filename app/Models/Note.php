<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
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

    /** @return BelongsTo<Application, $this> */
    public function jobApplication(): BelongsTo
    {
        return $this->belongsTo(Application::class, 'job_application_id', 'application_id');
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}
