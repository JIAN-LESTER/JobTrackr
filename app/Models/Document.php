<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Document extends Model
{
    /**
     * @property string|null $file_path
     */
    protected $primaryKey = 'document_id';

    protected $fillable = [
        'user_id',
        'job_application_id',
        'document_type',
        'file_name',
        'file_path',
        'mime_type',
        'file_size',
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
