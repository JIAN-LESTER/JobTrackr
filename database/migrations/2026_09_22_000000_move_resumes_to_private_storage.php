<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('documents')
            ->where('document_type', 'resume')
            ->orderBy('document_id')
            ->each(function (object $document): void {
                $path = (string) $document->file_path;

                if ($path === '' || ! Storage::disk('public')->exists($path)) {
                    return;
                }

                if (! Storage::disk('local')->put($path, Storage::disk('public')->get($path))) {
                    Log::error('Resume migration to private storage failed.', [
                        'document_id' => $document->document_id,
                        'file_path' => $path,
                    ]);

                    throw new RuntimeException("Could not move resume document {$document->document_id} to private storage.");
                }

                Storage::disk('public')->delete($path);

                Log::info('Resume moved to private storage.', [
                    'document_id' => $document->document_id,
                    'file_path' => $path,
                ]);
            });
    }

    public function down(): void
    {
        DB::table('documents')
            ->where('document_type', 'resume')
            ->orderBy('document_id')
            ->each(function (object $document): void {
                $path = (string) $document->file_path;

                if ($path === '' || ! Storage::disk('local')->exists($path)) {
                    return;
                }

                if (! Storage::disk('public')->put($path, Storage::disk('local')->get($path))) {
                    throw new RuntimeException("Could not restore resume document {$document->document_id} to public storage.");
                }

                Storage::disk('local')->delete($path);
            });
    }
};
