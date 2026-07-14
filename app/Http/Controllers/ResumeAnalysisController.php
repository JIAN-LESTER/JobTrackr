<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\Document;
use App\Models\ResumeAnalysis;
use App\Services\ResumeAnalyzer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use ZipArchive;

class ResumeAnalysisController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        $userId = $request->user()->getKey();

        return Inertia::render('AnalyzeResume', [
            'applications' => Application::query()->with('company')->where('user_id', $userId)->latest()->get(),
            'resumeDocuments' => Document::query()
                ->where('user_id', $userId)
                ->where('document_type', 'resume')
                ->latest()
                ->get(['document_id', 'file_name', 'mime_type', 'created_at']),
            'analyses' => ResumeAnalysis::query()->with(['jobApplication.company', 'resumeDocument'])->where('user_id', $userId)->latest()->limit(12)->get(),
            'selectedApplicationId' => $request->integer('application') ?: null,
        ]);
    }

    public function store(Request $request, ResumeAnalyzer $analyzer): JsonResponse|RedirectResponse
    {
        Log::info('Resume analysis request received.', [
            'user_id' => $request->user()->getKey(),
            'job_source' => $request->input('job_source'),
            'job_application_id' => $request->input('job_application_id'),
            'resume_source' => $request->input('resume_source'),
            'resume_document_id' => $request->input('resume_document_id'),
            'has_resume_file' => $request->hasFile('resume_file'),
        ]);

        $data = $request->validate([
            'job_source' => ['required', 'string', 'in:application,custom'],
            'job_application_id' => ['required', 'integer', 'exists:applications,application_id'],
            'job_description' => ['nullable', 'string', 'max:20000'],
            'job_post_url' => ['nullable', 'url', 'max:255'],
            'resume_source' => ['required', 'string', 'in:document,upload'],
            'resume_document_id' => ['nullable', 'integer', 'exists:documents,document_id'],
            'resume_file' => ['nullable', 'file', 'mimes:pdf,docx,txt', 'max:5120'],
        ]);

        $application = Application::query()->findOrFail($data['job_application_id']);
        abort_unless((string) $application->user_id === (string) $request->user()->getKey(), 404);
        Log::info('Resume analysis application resolved.', [
            'user_id' => $request->user()->getKey(),
            'application_id' => $application->getKey(),
            'job_source' => $data['job_source'],
        ]);

        $jobSource = (string) $data['job_source'];
        $jobDescription = $jobSource === 'custom'
            ? trim((string) ($data['job_description'] ?? ''))
            : trim((string) $application->job_description);
        $jobPostUrl = $jobSource === 'custom'
            ? (($data['job_post_url'] ?? null) ?: null)
            : $application->job_post_url;

        if ($jobDescription === '') {
            $jobDescriptionField = $jobSource === 'custom' ? 'job_description' : 'job_application_id';

            Log::warning('Resume analysis stopped because the job description is empty.', [
                'user_id' => $request->user()->getKey(),
                'application_id' => $application->getKey(),
                'job_source' => $jobSource,
            ]);

            throw ValidationException::withMessages([$jobDescriptionField => 'Add a job description before analyzing this resume.']);
        }
        Log::info('Resume analysis job context ready.', [
            'user_id' => $request->user()->getKey(),
            'application_id' => $application->getKey(),
            'job_source' => $jobSource,
            'job_description_length' => mb_strlen($jobDescription),
            'has_job_post_url' => $jobPostUrl !== null,
        ]);

        $resumeText = '';
        $document = null;
        $resumeSource = (string) $data['resume_source'];
        /** @var UploadedFile|null $resumeFile */
        $resumeFile = $request->file('resume_file');
        if ($resumeSource === 'document') {
            if (empty($data['resume_document_id'])) {
                Log::warning('Resume analysis stopped because no saved resume was selected.', [
                    'user_id' => $request->user()->getKey(),
                    'application_id' => $application->getKey(),
                ]);

                throw ValidationException::withMessages(['resume_document_id' => 'Select a saved resume to analyze.']);
            }

            $document = Document::query()
                ->where('user_id', $request->user()->getKey())
                ->where('document_type', 'resume')
                ->find($data['resume_document_id']);

            if (! $document) {
                Log::warning('Resume analysis stopped because the selected resume document was not found.', [
                    'user_id' => $request->user()->getKey(),
                    'application_id' => $application->getKey(),
                    'resume_document_id' => $data['resume_document_id'],
                ]);

                throw ValidationException::withMessages(['resume_document_id' => 'Select one of your saved resumes.']);
            }

            Log::info('Resume analysis using saved resume document.', [
                'user_id' => $request->user()->getKey(),
                'application_id' => $application->getKey(),
                'resume_document_id' => $document->getKey(),
                'file_name' => $document->file_name,
                'mime_type' => $document->mime_type,
            ]);

            $resumeText = $this->extractTextFromDocument($document);
        } elseif ($resumeSource === 'upload') {
            if (! $resumeFile) {
                Log::warning('Resume analysis stopped because no resume file was uploaded.', [
                    'user_id' => $request->user()->getKey(),
                    'application_id' => $application->getKey(),
                ]);

                throw ValidationException::withMessages(['resume_file' => 'Upload a resume to analyze.']);
            }

            Log::info('Resume analysis using uploaded resume file.', [
                'user_id' => $request->user()->getKey(),
                'application_id' => $application->getKey(),
                'file_name' => $resumeFile->getClientOriginalName(),
                'extension' => $resumeFile->getClientOriginalExtension(),
                'mime_type' => $resumeFile->getMimeType(),
                'file_size' => $resumeFile->getSize(),
            ]);

            $resumeText = $this->extractText($resumeFile);
        }
        if ($resumeText === '') {
            $resumeField = match ($resumeSource) {
                'document' => 'resume_document_id',
                default => 'resume_file',
            };

            Log::warning('Resume analysis stopped because no readable resume text was extracted.', [
                'user_id' => $request->user()->getKey(),
                'application_id' => $application->getKey(),
                'resume_source' => $resumeSource,
                'resume_document_id' => $document?->getKey(),
                'uploaded_file_name' => $resumeFile?->getClientOriginalName(),
            ]);

            throw ValidationException::withMessages([$resumeField => 'We could not read that resume. Use a PDF, DOCX, or TXT file with selectable text.']);
        }
        Log::info('Resume analysis resume text extracted.', [
            'user_id' => $request->user()->getKey(),
            'application_id' => $application->getKey(),
            'resume_source' => $resumeSource,
            'resume_text_length' => mb_strlen($resumeText),
        ]);

        Log::info('Resume analyzer service starting.', [
            'user_id' => $request->user()->getKey(),
            'application_id' => $application->getKey(),
            'resume_source' => $resumeSource,
            'resume_text_length' => mb_strlen($resumeText),
            'job_description_length' => mb_strlen($jobDescription),
        ]);
        $analysis = $analyzer->analyze($resumeText, $jobDescription);
        Log::info('Resume analyzer service completed.', [
            'user_id' => $request->user()->getKey(),
            'application_id' => $application->getKey(),
            'match_score' => $analysis['match_score'],
        ]);

        $document = $resumeSource === 'upload' && $resumeFile ? $this->storeResume($request, $application, $resumeFile) : $document;
        $resumeAnalysis = ResumeAnalysis::create([
            'user_id' => $request->user()->getKey(), 'job_application_id' => $application->getKey(),
            'resume_document_id' => $document?->getKey(), 'job_description' => $jobDescription,
            'job_post_url' => $jobPostUrl,
            'match_score' => $analysis['match_score'], 'analysis' => $analysis,
        ]);
        Log::info('Resume analyzed for application.', ['user_id' => $request->user()->getKey(), 'application_id' => $application->getKey(), 'analysis_id' => $resumeAnalysis->getKey()]);

        if ($request->header('X-Inertia')) {
            Inertia::flash('toast', ['type' => 'success', 'message' => 'Resume analysis saved to this application.']);
            return back();
        }

        return response()->json(['message' => 'Resume analysis saved to this application.', 'analysis' => $resumeAnalysis->load(['jobApplication.company', 'resumeDocument'])], 201);
    }

    private function storeResume(Request $request, Application $application, UploadedFile $file): Document
    {
        $path = $file->store("users/{$request->user()->getKey()}/documents", 'public');
        $document = Document::create(['user_id' => $request->user()->getKey(), 'job_application_id' => $application->getKey(), 'document_type' => 'resume', 'file_name' => $file->getClientOriginalName(), 'file_path' => $path, 'mime_type' => $file->getMimeType(), 'file_size' => $file->getSize()]);

        Log::info('Resume analysis uploaded resume stored.', [
            'user_id' => $request->user()->getKey(),
            'application_id' => $application->getKey(),
            'resume_document_id' => $document->getKey(),
            'file_name' => $document->file_name,
            'mime_type' => $document->mime_type,
            'file_size' => $document->file_size,
        ]);

        return $document;
    }

    private function extractText(UploadedFile $file): string
    {
        $extension = strtolower($file->getClientOriginalExtension());

        return $this->extractTextFromPath($file->getRealPath(), $extension);
    }

    private function extractTextFromDocument(Document $document): string
    {
        if (! $document->file_path || ! Storage::disk('public')->exists($document->file_path)) {
            Log::warning('Resume analysis saved resume file is missing from storage.', [
                'resume_document_id' => $document->getKey(),
                'file_name' => $document->file_name,
                'file_path' => $document->file_path,
            ]);

            return '';
        }

        $extension = strtolower(pathinfo($document->file_name, PATHINFO_EXTENSION));

        return $this->extractTextFromPath(Storage::disk('public')->path($document->file_path), $extension);
    }

    private function extractTextFromPath(string $path, string $extension): string
    {
        if (in_array($extension, ['txt', 'md'], true)) {
            return $this->cleanExtractedText((string) file_get_contents($path));
        }

        if ($extension === 'pdf') {
            return $this->extractPdfText($path);
        }

        if ($extension !== 'docx' || ! class_exists(ZipArchive::class)) {
            return '';
        }

        $archive = new ZipArchive;
        if ($archive->open($path) !== true) {
            return '';
        }

        $documentXml = $archive->getFromName('word/document.xml');
        $archive->close();

        return is_string($documentXml) ? $this->cleanExtractedText(strip_tags($documentXml)) : '';
    }

    private function extractPdfText(string $path): string
    {
        $contents = file_get_contents($path);
        if (! is_string($contents) || $contents === '') {
            return '';
        }

        $segments = [$contents];
        if (preg_match_all('/stream\r?\n(.*?)\r?\nendstream/s', $contents, $matches)) {
            foreach ($matches[1] as $stream) {
                $segments[] = $stream;

                foreach ($this->inflatePdfStream($stream) as $decoded) {
                    $segments[] = $decoded;
                }
            }
        }

        $text = [];
        foreach ($segments as $segment) {
            $text[] = $this->extractPdfTextOperators($segment);
        }

        return $this->cleanExtractedText(implode(' ', array_filter($text)));
    }

    /** @return list<string> */
    private function inflatePdfStream(string $stream): array
    {
        $decoded = [];
        foreach ([
            @gzuncompress($stream),
            @gzdecode($stream),
            @gzinflate($stream),
            @gzinflate(substr($stream, 2)),
        ] as $value) {
            if (is_string($value) && $value !== '') {
                $decoded[] = $value;
            }
        }

        return array_values(array_unique($decoded));
    }

    private function extractPdfTextOperators(string $contents): string
    {
        $text = [];

        if (preg_match_all('/\[(.*?)\]\s*TJ/s', $contents, $arrayMatches)) {
            foreach ($arrayMatches[1] as $arrayContent) {
                $text[] = $this->extractPdfStrings($arrayContent);
            }
        }

        if (preg_match_all('/(\((?:\\\\.|[^\\\\()])*\)|<[0-9A-Fa-f\s]+>)\s*(?:Tj|\'|")/s', $contents, $matches)) {
            foreach ($matches[1] as $value) {
                $text[] = $this->decodePdfString($value);
            }
        }

        return implode(' ', array_filter($text));
    }

    private function extractPdfStrings(string $contents): string
    {
        $text = [];

        if (preg_match_all('/\((?:\\\\.|[^\\\\()])*\)|<[0-9A-Fa-f\s]+>/s', $contents, $matches)) {
            foreach ($matches[0] as $value) {
                $text[] = $this->decodePdfString($value);
            }
        }

        return implode(' ', array_filter($text));
    }

    private function decodePdfString(string $value): string
    {
        if (str_starts_with($value, '<')) {
            $hex = preg_replace('/[^0-9A-Fa-f]/', '', trim($value, '<>')) ?? '';
            $binary = $hex !== '' ? @hex2bin($hex) : false;

            if (! is_string($binary)) {
                return '';
            }

            if (str_starts_with($binary, "\xFE\xFF")) {
                if (function_exists('mb_convert_encoding')) {
                    return $this->cleanExtractedText(mb_convert_encoding(substr($binary, 2), 'UTF-8', 'UTF-16BE'));
                }

                $converted = @iconv('UTF-16BE', 'UTF-8//IGNORE', substr($binary, 2));

                return is_string($converted) ? $this->cleanExtractedText($converted) : '';
            }

            return $this->cleanExtractedText($binary);
        }

        $value = substr($value, 1, -1);
        $value = preg_replace_callback('/\\\\([0-7]{1,3}|.)/s', function (array $matches) {
            $escaped = $matches[1];
            if (preg_match('/^[0-7]{1,3}$/', $escaped)) {
                return chr(octdec($escaped));
            }

            return match ($escaped) {
                'n' => "\n",
                'r' => "\r",
                't' => "\t",
                'b' => "\b",
                'f' => "\f",
                default => $escaped,
            };
        }, $value);

        return $this->cleanExtractedText((string) $value);
    }

    private function cleanExtractedText(string $value): string
    {
        $value = $this->ensureUtf8($value);
        $value = str_replace("\u{FFFD}", ' ', $value);
        $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', ' ', $value) ?? '';

        return trim(preg_replace('/\s+/u', ' ', $value) ?? $value);
    }

    private function ensureUtf8(string $value): string
    {
        if ($value === '') {
            return '';
        }

        if (function_exists('mb_check_encoding') && mb_check_encoding($value, 'UTF-8')) {
            return $value;
        }

        if (function_exists('mb_scrub')) {
            return mb_scrub($value, 'UTF-8');
        }

        if (function_exists('iconv')) {
            $converted = @iconv('UTF-8', 'UTF-8//IGNORE', $value);

            if (is_string($converted)) {
                return $converted;
            }
        }

        return preg_replace('/[^\x09\x0A\x0D\x20-\x7E]/', '', $value) ?? '';
    }
}
