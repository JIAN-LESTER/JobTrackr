<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Services\DocumentStorage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class DocumentController extends Controller
{
    public function download(Request $request, Document $document, DocumentStorage $storage): BinaryFileResponse
    {
        $isOwner = (string) $document->user_id === (string) $request->user()->getKey();

        if (! $isOwner || $document->document_type !== 'resume') {
            Log::warning('Unauthorized document download blocked.', [
                'user_id' => $request->user()->getKey(),
                'document_id' => $document->getKey(),
            ]);

            abort(404);
        }

        abort_unless($document->file_path && $storage->exists($document), 404);

        Log::info('Private resume download started.', [
            'user_id' => $request->user()->getKey(),
            'document_id' => $document->getKey(),
        ]);

        return response()->file(
            $storage->path($document),
            ['Content-Type' => $document->mime_type ?: 'application/octet-stream'],
        );
    }
}
