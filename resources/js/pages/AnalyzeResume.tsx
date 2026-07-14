import { Head, useForm } from '@inertiajs/react';
import { FileText, Sparkles, Upload } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import type { Application } from '@/types/Application';
import type {
    ResumeAnalysis,
    ResumeAnalysisResult,
} from '@/types/ResumeAnalysis';

type Props = {
    applications: Application[];
    resumeDocuments: ResumeDocument[];
    analyses: ResumeAnalysis[];
    selectedApplicationId: number | null;
    dailyLimit: number;
    analysesToday: number;
    nextResetAt: string;
    cooldownMinutes: number;
    cooldownSecondsRemaining: number;
};

type ResumeSource = 'document' | 'upload';
type JobSource = 'application' | 'custom';

type ResumeDocument = {
    document_id: number;
    file_name: string;
    mime_type: string | null;
    created_at: string;
};

type Form = {
    job_source: JobSource;
    job_application_id: string;
    job_description: string;
    job_post_url: string;
    resume_source: ResumeSource;
    resume_document_id: string;
    resume_file: File | null;
};

type FormErrors = Partial<Record<keyof Form | 'analysis', string>>;

const sections: Array<[keyof Omit<ResumeAnalysisResult, 'match_score'>, string]> = [
    ['missing_technical_skills', 'Missing technical skills'],
    ['relevant_skills_present', 'Relevant skills already present'],
    ['keyword_recommendations', 'Keyword recommendations'],
    ['experience_and_project_alignment', 'Experience and project alignment'],
    ['weak_or_unclear_sections', 'Weak or unclear resume sections'],
    ['suggested_bullet_point_improvements', 'Suggested bullet-point improvements'],
];

const formatDate = (value: string) =>
    new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
        new Date(value),
    );

const formatTime = (value: string) =>
    new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(value));

const formatCooldown = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }

    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
};

const secondsUntil = (value: string) =>
    Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / 1000));

const firstError = (errors: FormErrors) =>
    errors.analysis ||
    errors.job_source ||
    errors.job_description ||
    errors.job_post_url ||
    errors.resume_source ||
    errors.resume_document_id ||
    errors.resume_file ||
    errors.job_application_id ||
    'Resume analysis could not be completed.';

export default function AnalyzeResume({
    applications,
    resumeDocuments,
    analyses,
    selectedApplicationId,
    dailyLimit,
    analysesToday,
    nextResetAt,
    cooldownMinutes,
    cooldownSecondsRemaining,
}: Props) {
    const initialApplication =
        applications.find(
            (item) => item.application_id === selectedApplicationId,
        ) || applications[0];
    const [submitError, setSubmitError] = useState<string | null>(null);
    const initialResumeSource: ResumeSource = resumeDocuments.length
        ? 'document'
        : 'upload';
    const form = useForm<Form>({
        job_source: 'application',
        job_application_id: initialApplication
            ? String(initialApplication.application_id)
            : '',
        job_description: '',
        job_post_url: '',
        resume_source: initialResumeSource,
        resume_document_id: resumeDocuments[0]
            ? String(resumeDocuments[0].document_id)
            : '',
        resume_file: null,
    });
    const errors = form.errors as FormErrors;
    const remaining = Math.max(0, dailyLimit - analysesToday);
    const [cooldownRemaining, setCooldownRemaining] = useState(
        cooldownSecondsRemaining,
    );
    const [resetRemaining, setResetRemaining] = useState(
        secondsUntil(nextResetAt),
    );
    const isQuotaReached = remaining === 0;
    const isCooldownActive = cooldownRemaining > 0;
    const selectedResumeDocument = resumeDocuments.find(
        (resume) => String(resume.document_id) === form.data.resume_document_id,
    );

    useEffect(() => {
        setCooldownRemaining(cooldownSecondsRemaining);
    }, [cooldownSecondsRemaining]);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setCooldownRemaining((seconds) => Math.max(0, seconds - 1));
            setResetRemaining(secondsUntil(nextResetAt));
        }, 1000);

        return () => window.clearInterval(timer);
    }, [nextResetAt]);

    const selectApplication = (value: string) => {
        setSubmitError(null);
        form.setData({
            ...form.data,
            job_application_id: value,
        });
    };

    const selectJobSource = (source: JobSource) => {
        setSubmitError(null);
        form.setData({
            ...form.data,
            job_source: source,
        });
    };

    const selectResumeSource = (source: ResumeSource) => {
        setSubmitError(null);
        form.setData({
            ...form.data,
            resume_source: source,
            resume_document_id:
                source === 'document'
                    ? form.data.resume_document_id ||
                      (resumeDocuments[0]
                          ? String(resumeDocuments[0].document_id)
                          : '')
                    : '',
            resume_file: null,
        });
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitError(null);
        form.clearErrors();

        const toastId = toast.loading('Analyzing resume...');
        let keepToastVisible = false;

        form.post('/analyze-resume', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                form.reset('resume_file');
                toast.dismiss(toastId);
            },
            onError: (nextErrors) => {
                const message = firstError(nextErrors as FormErrors);

                keepToastVisible = true;
                setSubmitError(message);
                toast.error(message, { id: toastId });
            },
            onFinish: () => {
                if (!keepToastVisible) {
                    toast.dismiss(toastId);
                }
            },
        });
    };

    return (
        <>
            <Head title="Analyze Job & Resume" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto bg-[#eef3ef] p-4 dark:bg-background">
                <div className="flex flex-col gap-3 rounded-lg border border-[#cbd8cf] bg-[#f8faf7] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-[#33463a] dark:bg-[#16231c]">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">
                            Analyze Job & Resume
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Match your resume to an application and save the
                            feedback with that job.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="w-fit">
                            {remaining} of {dailyLimit} analyses left
                        </Badge>
                        <Badge variant="outline" className="w-fit">
                            {cooldownMinutes}-minute interval
                        </Badge>
                        {isCooldownActive ? (
                            <Badge variant="outline" className="w-fit">
                                Next in {formatCooldown(cooldownRemaining)}
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="w-fit">
                                Reset in {formatCooldown(resetRemaining)} at{' '}
                                {formatTime(nextResetAt)}
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,1fr)]">
                    <form
                        onSubmit={submit}
                        className="space-y-4 rounded-lg border border-[#cbd8cf] bg-[#f8faf7] p-4 shadow-sm dark:border-[#33463a] dark:bg-[#16231c]"
                    >
                        {submitError ? (
                            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                                {submitError}
                            </div>
                        ) : null}

                        <div>
                            <Label htmlFor="application">Applied job</Label>
                            <Select
                                value={form.data.job_application_id}
                                onValueChange={selectApplication}
                            >
                                <SelectTrigger
                                    id="application"
                                    className="mt-2"
                                >
                                    <SelectValue placeholder="Select an application" />
                                </SelectTrigger>
                                <SelectContent>
                                    {applications.map((application) => (
                                        <SelectItem
                                            key={application.application_id}
                                            value={String(
                                                application.application_id,
                                            )}
                                        >
                                            {application.job_title} -{' '}
                                            {application.company?.name ||
                                                'Unknown company'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.job_application_id} />
                        </div>

                        <div className="space-y-3">
                            <div>
                                <Label>Job details</Label>
                                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                    <SourceOption
                                        id="job-source-application"
                                        name="job_source"
                                        checked={
                                            form.data.job_source ===
                                            'application'
                                        }
                                        title="Use selected job"
                                        description="Match against saved application details"
                                        onChange={() =>
                                            selectJobSource('application')
                                        }
                                    />
                                    <SourceOption
                                        id="job-source-custom"
                                        name="job_source"
                                        checked={
                                            form.data.job_source === 'custom'
                                        }
                                        title="Paste job details"
                                        description="Use a different description or link"
                                        onChange={() =>
                                            selectJobSource('custom')
                                        }
                                    />
                                </div>
                                <InputError message={errors.job_source} />
                            </div>

                            {form.data.job_source === 'custom' ? (
                                <>
                                    <div>
                                        <Label htmlFor="job-description">
                                            Job description
                                        </Label>
                                        <textarea
                                            id="job-description"
                                            value={form.data.job_description}
                                            onChange={(event) =>
                                                form.setData(
                                                    'job_description',
                                                    event.target.value,
                                                )
                                            }
                                            rows={8}
                                            className="mt-2 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                                            placeholder="Paste the job description."
                                        />
                                        <InputError
                                            message={errors.job_description}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="job-link">
                                            Job link
                                        </Label>
                                        <Input
                                            id="job-link"
                                            className="mt-2"
                                            value={form.data.job_post_url}
                                            onChange={(event) =>
                                                form.setData(
                                                    'job_post_url',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="https://..."
                                        />
                                        <InputError
                                            message={errors.job_post_url}
                                        />
                                    </div>
                                </>
                            ) : null}
                        </div>

                        <div className="space-y-3">
                            <div>
                                <Label>Select resume</Label>
                                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                    <SourceOption
                                        id="resume-source-document"
                                        name="resume_source"
                                        checked={
                                            form.data.resume_source ===
                                            'document'
                                        }
                                        disabled={!resumeDocuments.length}
                                        title="Saved resume"
                                        description={
                                            selectedResumeDocument
                                                ? selectedResumeDocument.file_name
                                                : 'No saved resumes'
                                        }
                                        onChange={() =>
                                            selectResumeSource('document')
                                        }
                                    />
                                    <SourceOption
                                        id="resume-source-upload"
                                        name="resume_source"
                                        checked={
                                            form.data.resume_source ===
                                            'upload'
                                        }
                                        title="Upload other"
                                        description="PDF, DOCX, or TXT"
                                        onChange={() =>
                                            selectResumeSource('upload')
                                        }
                                    />
                                </div>
                                <InputError message={errors.resume_source} />
                            </div>

                            {form.data.resume_source === 'document' ? (
                                <div>
                                    <Label htmlFor="resume-document">
                                        Saved resume
                                    </Label>
                                    <Select
                                        value={form.data.resume_document_id}
                                        onValueChange={(value) =>
                                            form.setData(
                                                'resume_document_id',
                                                value,
                                            )
                                        }
                                    >
                                        <SelectTrigger
                                            id="resume-document"
                                            className="mt-2"
                                        >
                                            <SelectValue placeholder="Select a saved resume" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {resumeDocuments.map((resume) => (
                                                <SelectItem
                                                    key={resume.document_id}
                                                    value={String(
                                                        resume.document_id,
                                                    )}
                                                >
                                                    {resume.file_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={errors.resume_document_id}
                                    />
                                </div>
                            ) : null}

                            {form.data.resume_source === 'upload' ? (
                                <div>
                                    <Label htmlFor="resume-file">
                                        Upload resume
                                    </Label>
                                    <div className="mt-2 flex items-center gap-2">
                                        <Input
                                            id="resume-file"
                                            type="file"
                                            accept=".pdf,.docx,.txt"
                                            onChange={(event) =>
                                                form.setData(
                                                    'resume_file',
                                                    event.target.files?.[0] ||
                                                        null,
                                                )
                                            }
                                        />
                                        <Upload className="size-5 text-muted-foreground" />
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        PDF, DOCX, or TXT with selectable text.
                                    </p>
                                    <InputError message={errors.resume_file} />
                                </div>
                            ) : null}
                        </div>

                        <InputError message={errors.analysis} />

                        <Button
                            type="submit"
                            disabled={
                                form.processing ||
                                !applications.length ||
                                isQuotaReached ||
                                isCooldownActive
                            }
                        >
                            {form.processing ? (
                                <Spinner />
                            ) : (
                                <Sparkles className="size-4" />
                            )}
                            {isCooldownActive
                                ? `Wait ${formatCooldown(cooldownRemaining)}`
                                : 'Analyze and save'}
                        </Button>
                    </form>

                    <section className="space-y-4">
                        <div className="rounded-lg border border-[#cbd8cf] bg-[#f8faf7] p-4 shadow-sm dark:border-[#33463a] dark:bg-[#16231c]">
                            <h2 className="font-semibold">
                                What JobTrackr returns
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Match score, skills gaps, keywords, alignment
                                feedback, weak sections, and stronger bullet
                                suggestions.
                            </p>
                        </div>
                        {analyses.map((item) => (
                            <AnalysisCard
                                key={item.resume_analysis_id}
                                item={item}
                            />
                        ))}
                        {!analyses.length && (
                            <div className="rounded-lg border border-dashed border-[#aebfb3] p-8 text-center text-sm text-muted-foreground">
                                Your saved job analyses will appear here.
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}

function SourceOption({
    id,
    name,
    checked,
    disabled = false,
    title,
    description,
    onChange,
}: {
    id: string;
    name: string;
    checked: boolean;
    disabled?: boolean;
    title: string;
    description: string;
    onChange: () => void;
}) {
    return (
        <label
            htmlFor={id}
            className={`flex min-h-24 cursor-pointer flex-col gap-2 rounded-md border p-3 text-sm transition-colors ${
                checked
                    ? 'border-[#4f8f67] bg-[#e6f2ea] dark:border-[#7cc492] dark:bg-[#203529]'
                    : 'border-[#cbd8cf] bg-transparent dark:border-[#33463a]'
            } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
        >
            <span className="flex items-center gap-2 font-medium">
                <input
                    id={id}
                    type="radio"
                    name={name}
                    checked={checked}
                    disabled={disabled}
                    onChange={onChange}
                    className="size-4 accent-[#4f8f67]"
                />
                {title}
            </span>
            <span className="text-xs text-muted-foreground">
                {description}
            </span>
        </label>
    );
}

function AnalysisCard({ item }: { item: ResumeAnalysis }) {
    return (
        <article className="rounded-lg border border-[#cbd8cf] bg-[#f8faf7] p-4 shadow-sm dark:border-[#33463a] dark:bg-[#16231c]">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="font-semibold">
                        {item.job_application?.job_title || 'Application'}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {item.job_application?.company?.name ||
                            'Unknown company'}{' '}
                        - analyzed {formatDate(item.created_at)}
                    </p>
                    {item.resume_document ? (
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <FileText className="size-3" />
                            {item.resume_document.file_name}
                        </p>
                    ) : null}
                </div>
                <div className="rounded-full bg-[#dcefe4] px-3 py-2 text-sm font-semibold text-[#24543d] dark:bg-[#2f6f4f]/25 dark:text-[#b8e6ca]">
                    {item.match_score}% match
                </div>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
                {sections.map(([key, title]) => (
                    <div key={key}>
                        <h3 className="text-sm font-medium">{title}</h3>
                        <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                            {item.analysis[key].length ? (
                                item.analysis[key].map((entry) => (
                                    <li key={entry}>- {entry}</li>
                                ))
                            ) : (
                                <li>- No issues identified.</li>
                            )}
                        </ul>
                    </div>
                ))}
            </div>
        </article>
    );
}

AnalyzeResume.layout = {
    breadcrumbs: [{ title: 'Analyze Job & Resume', href: '/analyze-resume' }],
};
