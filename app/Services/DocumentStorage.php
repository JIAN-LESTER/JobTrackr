<?php

namespace App\Services;

use App\Models\Document;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class DocumentStorage
{
    public function diskFor(string $documentType): string
    {
        return $documentType === 'resume' ? 'local' : 'public';
    }

    public function store(UploadedFile $file, int|string $userId, string $documentType): string
    {
        $path = $file->store("users/{$userId}/documents", $this->diskFor($documentType));

        if (! is_string($path) || $path === '') {
            throw new \RuntimeException('The uploaded document could not be stored.');
        }

        return $path;
    }

    public function exists(Document $document): bool
    {
        return $document->file_path !== ''
            && Storage::disk($this->diskFor($document->document_type))->exists($document->file_path);
    }

    public function path(Document $document): string
    {
        return Storage::disk($this->diskFor($document->document_type))->path((string) $document->file_path);
    }

    public function delete(Document $document): void
    {
        if ($document->file_path) {
            Storage::disk($this->diskFor($document->document_type))->delete($document->file_path);
        }
    }
}
