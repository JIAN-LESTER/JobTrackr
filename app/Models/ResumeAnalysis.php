<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ResumeAnalysis extends Model
{
    /** @use HasFactory<Factory<self>> */
    use HasFactory;

    protected $primaryKey = 'resume_analysis_id';

    protected $fillable = [
        'user_id',
        'job_application_id',
        'resume_document_id',
        'job_description',
        'job_post_url',
        'match_score',
        'analysis',
    ];

    protected function casts(): array
    {
        return [
            'analysis' => 'array',
        ];
    }

    /** @return BelongsTo<Application, $this> */
    public function jobApplication(): BelongsTo
    {
        return $this->belongsTo(Application::class, 'job_application_id', 'application_id');
    }

    /** @return BelongsTo<Document, $this> */
    public function resumeDocument(): BelongsTo
    {
        return $this->belongsTo(Document::class, 'resume_document_id', 'document_id');
    }
}
