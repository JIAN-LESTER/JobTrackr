import { Head, Link, useForm } from '@inertiajs/react';
import { ChevronDown, FileText, Sparkles, Upload } from 'lucide-react';
import type { DragEvent, FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
    file_size: number | null;
    file_url: string | null;
    mime_type: string | null;
    created_at: string;
};

type Form = {
    job_source: JobSource;
    job_application_id: string;
    custom_job_title: string;
    custom_company_name: string;
    job_description: string;
    job_post_url: string;
    resume_source: ResumeSource;
    resume_document_id: string;
    resume_file: File | null;
};

type FormErrors = Partial<Record<keyof Form | 'analysis', string>>;

type TimerState = {
    currentTime: number | null;
    cooldownEndsAt: number;
    cooldownSecondsRemaining: number;
};

const sections: Array<
    [keyof Omit<ResumeAnalysisResult, 'match_score' | 'company_name'>, string]
> = [
    ['missing_technical_skills', 'Missing technical skills'],
    ['relevant_skills_present', 'Relevant skills already present'],
    ['keyword_recommendations', 'Keyword recommendations'],
    ['experience_and_project_alignment', 'Experience and project alignment'],
    ['weak_or_unclear_sections', 'Weak or unclear resume sections'],
    [
        'suggested_bullet_point_improvements',
        'Suggested bullet-point improvements',
    ],
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

const formatFileSize = (bytes: number | null) => {
    if (!bytes) {
        return 'Size unavailable';
    }

    if (bytes < 1024 * 1024) {
        return `${Math.round(bytes / 1024)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatCooldown = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }

    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
};

const secondsBetween = (endTime: number, currentTime: number) =>
    Math.max(0, Math.ceil((endTime - currentTime) / 1000));

const genericCompanyNames = ['Imported', 'Unknown company', 'Website'];
const genericApplicationTitles = ['Application', 'Imported job'];

const cleanLabel = (value: string | null | undefined) => value?.trim() || '';

const websiteLabel = (url: string | null) => {
    if (!url) {
        return '';
    }

    try {
        return new URL(url).hostname.replace(/^www\./, '') || '';
    } catch {
        return '';
    }
};

const isGenericCompanyName = (value: string) =>
    genericCompanyNames.some(
        (name) => name.toLowerCase() === value.toLowerCase(),
    );

const isGenericApplicationTitle = (value: string) =>
    genericApplicationTitles.some(
        (title) => title.toLowerCase() === value.toLowerCase(),
    );

const companyFromDescription = (description: string) => {
    const patterns = [
        /(?:^|\n)\s*(?:company|employer|organization|hiring company)\s*[:-]\s*([^\n\r|\u2022]+)/i,
        /(?:^|\n)\s*about\s+(?!us\b|the company\b|our company\b)([A-Z][^\n\r.]{1,79})/,
        /(?:^|\n)\s*at\s+([A-Z][-A-Za-z0-9&.' ]{1,60}),\s+(?:we|our)\b/i,
    ];

    for (const pattern of patterns) {
        const match = description.match(pattern);
        const company = match?.[1]?.trim().replace(/[.,;:]$/, '');

        if (company && company.length <= 80) {
            return company;
        }
    }

    return '';
};

const analysisCompanyName = (item: ResumeAnalysis) => {
    const savedCompany = cleanLabel(item.job_application?.company?.name);
    const analyzedCompany = cleanLabel(item.analysis.company_name);
    const descriptionCompany = companyFromDescription(item.job_description);
    const urlCompany = websiteLabel(item.job_post_url);

    return (
        [savedCompany, analyzedCompany, descriptionCompany, urlCompany].find(
            (company) => company && !isGenericCompanyName(company),
        ) ||
        savedCompany ||
        analyzedCompany ||
        descriptionCompany ||
        urlCompany ||
        'Unknown company'
    );
};

const analysisTitle = (item: ResumeAnalysis) => {
    const title = cleanLabel(item.job_application?.job_title);

    return title && !isGenericApplicationTitle(title)
        ? title
        : analysisCompanyName(item);
};

const firstError = (errors: FormErrors) =>
    errors.analysis ||
    errors.job_source ||
    errors.job_description ||
    errors.custom_job_title ||
    errors.custom_company_name ||
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
        custom_job_title: initialApplication?.job_title || '',
        custom_company_name: initialApplication?.company?.name || '',
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
    const currentAnalysisId = analyses[0]?.resume_analysis_id;
    const [openAnalysisIds, setOpenAnalysisIds] = useState<number[]>([]);
    const [closedAnalysisIds, setClosedAnalysisIds] = useState<number[]>([]);
    const [isApplicationDetailsOpen, setIsApplicationDetailsOpen] =
        useState(false);
    const [timerState, setTimerState] = useState<TimerState>({
        currentTime: null,
        cooldownEndsAt: cooldownSecondsRemaining * 1000,
        cooldownSecondsRemaining,
    });

    const cooldownRemaining =
        timerState.currentTime === null
            ? cooldownSecondsRemaining
            : secondsBetween(timerState.cooldownEndsAt, timerState.currentTime);
    const resetRemaining =
        timerState.currentTime === null
            ? 0
            : secondsBetween(
                  new Date(nextResetAt).getTime(),
                  timerState.currentTime,
              );
    const isQuotaReached = remaining === 0;
    const isCooldownActive = cooldownRemaining > 0;
    const selectedResumeDocument = resumeDocuments.find(
        (resume) => String(resume.document_id) === form.data.resume_document_id,
    );
    const selectedApplication = applications.find(
        (application) =>
            String(application.application_id) === form.data.job_application_id,
    );
    const selectedApplicationDescription =
        selectedApplication?.job_description?.trim() || '';

    useEffect(() => {
        const timer = window.setInterval(() => {
            setTimerState((state) => {
                const currentTime = Date.now();
                const cooldownEndsAt =
                    state.currentTime !== null &&
                    state.cooldownSecondsRemaining === cooldownSecondsRemaining
                        ? state.cooldownEndsAt
                        : currentTime + cooldownSecondsRemaining * 1000;

                return {
                    currentTime,
                    cooldownEndsAt,
                    cooldownSecondsRemaining,
                };
            });
        }, 1000);

        return () => window.clearInterval(timer);
    }, [cooldownSecondsRemaining]);

    const selectApplication = (value: string) => {
        setSubmitError(null);
        setIsApplicationDetailsOpen(false);
        const application = applications.find(
            (item) => String(item.application_id) === value,
        );

        form.setData({
            ...form.data,
            job_application_id: value,
            custom_job_title:
                application?.job_title || form.data.custom_job_title,
            custom_company_name:
                application?.company?.name || form.data.custom_company_name,
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

    const selectResumeFile = (file: File | null) => {
        setSubmitError(null);
        form.setData('resume_file', file);
    };

    const dropResumeFile = (event: DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        selectResumeFile(event.dataTransfer.files?.[0] || null);
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

    const toggleAnalysisCard = (id: number, open: boolean) => {
        setClosedAnalysisIds((ids) => {
            if (!open) {
                return ids.includes(id) ? ids : [...ids, id];
            }

            return ids.filter((closedId) => closedId !== id);
        });
        setOpenAnalysisIds((ids) => {
            if (open) {
                return ids.includes(id) ? ids : [...ids, id];
            }

            return ids.filter((openId) => openId !== id);
        });
    };

    return (
        <>
            <Head title="Analyze Job & Resume" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto bg-[#eef3ef] p-4 dark:bg-background">
                <div className="flex flex-col gap-4 rounded-lg border border-[#cbd8cf] bg-[#f8faf7] p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between dark:border-[#33463a] dark:bg-[#16231c]">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">
                            Analyze Job & Resume
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Match your resume to an application and save the
                            feedback with that job.
                        </p>
                    </div>
                    <div className="grid gap-2 rounded-md border border-[#cbd8cf] bg-white/70 p-2 text-xs shadow-xs sm:grid-cols-3 dark:border-[#33463a] dark:bg-[#213128]/50">
                        <StatusMetric
                            label="Analyses left"
                            value={`${remaining}/${dailyLimit}`}
                        />
                        <StatusMetric
                            label={
                                isCooldownActive
                                    ? 'Ready again in'
                                    : 'Availability'
                            }
                            value={
                                isCooldownActive
                                    ? formatCooldown(cooldownRemaining)
                                    : 'Ready'
                            }
                            detail={
                                isCooldownActive
                                    ? `${cooldownMinutes}-minute interval`
                                    : undefined
                            }
                            emphasized
                        />
                        <StatusMetric
                            label="Daily reset"
                            value={formatCooldown(resetRemaining)}
                            detail={formatTime(nextResetAt)}
                        />
                    </div>
                </div>

                <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,640px)_minmax(360px,1fr)]">
                    <form
                        onSubmit={submit}
                        className="w-full max-w-[640px] space-y-4 rounded-lg border border-[#cbd8cf] bg-[#f8faf7] p-4 shadow-sm dark:border-[#33463a] dark:bg-[#16231c]"
                    >
                        {submitError ? (
                            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                                {submitError}
                            </div>
                        ) : null}

                        <div className="space-y-3">
                            <div>
                                <p className="text-sm font-medium">
                                    1. Job details
                                </p>
                                <SegmentedControl
                                    value={form.data.job_source}
                                    options={[
                                        {
                                            value: 'application',
                                            label: 'Use saved application',
                                        },
                                        {
                                            value: 'custom',
                                            label: 'Enter custom job',
                                        },
                                    ]}
                                    onChange={selectJobSource}
                                />
                                <InputError message={errors.job_source} />
                            </div>

                            {form.data.job_source === 'application' ? (
                                <div className="space-y-3">
                                    <div>
                                        <Label htmlFor="application">
                                            Application
                                        </Label>
                                        <Select
                                            value={form.data.job_application_id}
                                            onValueChange={selectApplication}
                                        >
                                            <SelectTrigger
                                                id="application"
                                                className="mt-2 w-full"
                                            >
                                                <SelectValue placeholder="Select an application" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {applications.map(
                                                    (application) => (
                                                        <SelectItem
                                                            key={
                                                                application.application_id
                                                            }
                                                            value={String(
                                                                application.application_id,
                                                            )}
                                                        >
                                                            {
                                                                application.job_title
                                                            }{' '}
                                                            -{' '}
                                                            {application.company
                                                                ?.name ||
                                                                'Unknown company'}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={errors.job_application_id}
                                        />
                                    </div>

                                    {selectedApplication ? (
                                        <Collapsible
                                            open={isApplicationDetailsOpen}
                                            onOpenChange={
                                                setIsApplicationDetailsOpen
                                            }
                                            className="rounded-md border border-[#cbd8cf] bg-white/60 p-3 text-sm dark:border-[#33463a] dark:bg-[#213128]/50"
                                        >
                                            <p className="font-medium">
                                                {selectedApplication.job_title}
                                            </p>
                                            <p className="mt-1 text-muted-foreground">
                                                {selectedApplication.company
                                                    ?.name || 'Unknown company'}
                                                {' - '}
                                                {selectedApplication.location ||
                                                    'Location not set'}
                                                {' - '}
                                                {selectedApplication.applied_date
                                                    ? `Applied ${formatDate(selectedApplication.applied_date)}`
                                                    : 'Applied date not set'}
                                            </p>
                                            <div className="mt-4 flex items-end justify-between gap-3">
                                                <div>
                                                    <p className="font-medium">
                                                        {selectedApplicationDescription
                                                            ? 'Job description found'
                                                            : 'Job description missing'}
                                                    </p>
                                                    <p className="text-muted-foreground">
                                                        {selectedApplicationDescription.length.toLocaleString()}{' '}
                                                        characters
                                                    </p>
                                                </div>
                                                <div className="flex shrink-0 flex-wrap justify-end gap-2">
                                                    <CollapsibleTrigger
                                                        asChild
                                                        disabled={
                                                            !selectedApplicationDescription
                                                        }
                                                    >
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            disabled={
                                                                !selectedApplicationDescription
                                                            }
                                                        >
                                                            {isApplicationDetailsOpen
                                                                ? 'Hide details'
                                                                : 'Show details'}
                                                            <ChevronDown
                                                                className={`size-4 transition-transform ${
                                                                    isApplicationDetailsOpen
                                                                        ? 'rotate-180'
                                                                        : ''
                                                                }`}
                                                            />
                                                        </Button>
                                                    </CollapsibleTrigger>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={`/applications/${selectedApplication.application_id}`}
                                                        >
                                                            View details
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                            {selectedApplicationDescription ? (
                                                <CollapsibleContent>
                                                    <div className="mt-3 max-h-64 overflow-y-auto rounded-md border border-[#cbd8cf] bg-[#f8faf7] p-3 whitespace-pre-wrap text-muted-foreground dark:border-[#33463a] dark:bg-[#16231c]">
                                                        {
                                                            selectedApplicationDescription
                                                        }
                                                    </div>
                                                </CollapsibleContent>
                                            ) : null}
                                        </Collapsible>
                                    ) : null}
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <Label htmlFor="custom-job-title">
                                            Job title
                                        </Label>
                                        <Input
                                            id="custom-job-title"
                                            className="mt-2"
                                            value={form.data.custom_job_title}
                                            onChange={(event) =>
                                                form.setData(
                                                    'custom_job_title',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Software Engineer"
                                        />
                                        <InputError
                                            message={errors.custom_job_title}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="custom-company-name">
                                            Company - optional
                                        </Label>
                                        <Input
                                            id="custom-company-name"
                                            className="mt-2"
                                            value={
                                                form.data.custom_company_name
                                            }
                                            onChange={(event) =>
                                                form.setData(
                                                    'custom_company_name',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Thales"
                                        />
                                        <InputError
                                            message={errors.custom_company_name}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="job-post-url">
                                            Job post URL - optional
                                        </Label>
                                        <Input
                                            id="job-post-url"
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
                                            placeholder="Paste the complete job description here..."
                                        />
                                        <p className="mt-1 text-right text-xs text-muted-foreground">
                                            {form.data.job_description.length.toLocaleString()}{' '}
                                            characters
                                        </p>
                                        <InputError
                                            message={errors.job_description}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="space-y-3">
                            <div>
                                <p className="text-sm font-medium">
                                    2. Choose resume
                                </p>
                                <SegmentedControl
                                    value={form.data.resume_source}
                                    options={[
                                        {
                                            value: 'document',
                                            label: 'Use saved resume',
                                            disabled: !resumeDocuments.length,
                                        },
                                        {
                                            value: 'upload',
                                            label: 'Upload another',
                                        },
                                    ]}
                                    onChange={selectResumeSource}
                                />
                                <InputError message={errors.resume_source} />
                            </div>

                            {form.data.resume_source === 'document' ? (
                                <div className="space-y-3">
                                    <div>
                                        <Label htmlFor="resume-document">
                                            Resume
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
                                                className="mt-2 w-full"
                                            >
                                                <SelectValue placeholder="Select a saved resume" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {resumeDocuments.map(
                                                    (resume) => (
                                                        <SelectItem
                                                            key={
                                                                resume.document_id
                                                            }
                                                            value={String(
                                                                resume.document_id,
                                                            )}
                                                        >
                                                            {resume.file_name}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {selectedResumeDocument ? (
                                        <div className="flex items-start gap-3 rounded-md border border-[#cbd8cf] bg-white/60 p-3 text-sm dark:border-[#33463a] dark:bg-[#213128]/50">
                                            <FileText className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-medium">
                                                    {
                                                        selectedResumeDocument.file_name
                                                    }
                                                </p>
                                                <p className="mt-1 text-muted-foreground">
                                                    Updated{' '}
                                                    {formatDate(
                                                        selectedResumeDocument.created_at,
                                                    )}{' '}
                                                    -{' '}
                                                    {formatFileSize(
                                                        selectedResumeDocument.file_size,
                                                    )}
                                                </p>
                                                <div className="mt-3 flex justify-end gap-2">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={
                                                            !selectedResumeDocument.file_url
                                                        }
                                                        asChild={
                                                            !!selectedResumeDocument.file_url
                                                        }
                                                    >
                                                        {selectedResumeDocument.file_url ? (
                                                            <a
                                                                href={
                                                                    selectedResumeDocument.file_url
                                                                }
                                                                target="_blank"
                                                                rel="noreferrer"
                                                            >
                                                                Preview
                                                            </a>
                                                        ) : (
                                                            'Preview'
                                                        )}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            document
                                                                .getElementById(
                                                                    'resume-document',
                                                                )
                                                                ?.click()
                                                        }
                                                    >
                                                        Change
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}
                                    <InputError
                                        message={errors.resume_document_id}
                                    />
                                </div>
                            ) : null}

                            {form.data.resume_source === 'upload' ? (
                                <div>
                                    <label
                                        htmlFor="resume-file"
                                        onDrop={dropResumeFile}
                                        onDragOver={(event) =>
                                            event.preventDefault()
                                        }
                                        className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-[#aebfb3] bg-white/50 p-6 text-center text-sm transition-colors hover:bg-white/80 dark:border-[#33463a] dark:bg-[#213128]/40 dark:hover:bg-[#213128]/70"
                                    >
                                        <Upload className="mb-3 size-6 text-muted-foreground" />
                                        <span className="font-medium">
                                            {form.data.resume_file
                                                ? form.data.resume_file.name
                                                : 'Drop your resume here'}
                                        </span>
                                        <span className="mt-1 text-muted-foreground">
                                            or click to browse your computer
                                        </span>
                                        <span className="mt-4 text-xs text-muted-foreground">
                                            PDF, DOCX, or TXT - Max 5 MB
                                        </span>
                                        <Input
                                            id="resume-file"
                                            type="file"
                                            accept=".pdf,.docx,.txt"
                                            className="sr-only"
                                            onChange={(event) =>
                                                selectResumeFile(
                                                    event.target.files?.[0] ||
                                                        null,
                                                )
                                            }
                                        />
                                    </label>
                                    <InputError message={errors.resume_file} />
                                </div>
                            ) : null}
                        </div>

                        <InputError message={errors.analysis} />

                        <Button
                            type="submit"
                            className="bg-[#17201b] text-[#f4f8f2] hover:bg-[#2d3b31] dark:bg-[#f3c76a] dark:text-[#17201b] dark:hover:bg-[#e0b657]"
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
                            <h2 className="font-semibold">Analyzed Resumes</h2>
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
                                isOpen={
                                    openAnalysisIds.includes(
                                        item.resume_analysis_id,
                                    ) ||
                                    (item.resume_analysis_id ===
                                        currentAnalysisId &&
                                        !closedAnalysisIds.includes(
                                            item.resume_analysis_id,
                                        ))
                                }
                                onOpenChange={(open) =>
                                    toggleAnalysisCard(
                                        item.resume_analysis_id,
                                        open,
                                    )
                                }
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

function StatusMetric({
    label,
    value,
    detail,
    emphasized = false,
}: {
    label: string;
    value: string;
    detail?: string;
    emphasized?: boolean;
}) {
    const helperClassName = emphasized
        ? 'text-[#dbe7df] dark:text-[#5c4a16]'
        : 'text-muted-foreground';

    return (
        <div
            className={`rounded-sm px-3 py-2 ${
                emphasized
                    ? 'bg-[#17201b] text-[#f4f8f2] dark:bg-[#f3c76a] dark:text-[#17201b]'
                    : 'bg-[#f8faf7] text-foreground dark:bg-[#16231c]'
            }`}
        >
            <p
                className={`text-[11px] font-medium tracking-wide uppercase ${helperClassName}`}
            >
                {label}
            </p>
            <p className="mt-0.5 text-base leading-none font-semibold">
                {value}
            </p>
            {detail ? (
                <p className={`mt-1 text-[11px] ${helperClassName}`}>
                    {detail}
                </p>
            ) : null}
        </div>
    );
}

function SegmentedControl<T extends string>({
    value,
    options,
    onChange,
}: {
    value: T;
    options: Array<{ value: T; label: string; disabled?: boolean }>;
    onChange: (value: T) => void;
}) {
    return (
        <div
            className="mt-2 inline-flex w-full rounded-md border border-[#cbd8cf] bg-white/60 p-1 sm:w-auto dark:border-[#33463a] dark:bg-[#213128]/50"
            role="group"
        >
            {options.map((option) => {
                const isSelected = value === option.value;

                return (
                    <button
                        key={option.value}
                        type="button"
                        disabled={option.disabled}
                        aria-pressed={isSelected}
                        onClick={() => onChange(option.value)}
                        className={`min-h-8 flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors sm:flex-none ${
                            isSelected
                                ? 'bg-[#17201b] text-[#f4f8f2] shadow-xs dark:bg-[#f3c76a] dark:text-[#17201b]'
                                : 'text-muted-foreground hover:bg-[#e6f2ea] hover:text-foreground dark:hover:bg-[#203529]'
                        } ${
                            option.disabled
                                ? 'cursor-not-allowed opacity-50'
                                : ''
                        }`}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}

function AnalysisCard({
    item,
    isOpen,
    onOpenChange,
}: {
    item: ResumeAnalysis;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const title = analysisTitle(item);
    const company = analysisCompanyName(item);
    const titleIsCompany = title.toLowerCase() === company.toLowerCase();

    return (
        <Collapsible
            open={isOpen}
            onOpenChange={onOpenChange}
            className="rounded-lg border border-[#cbd8cf] bg-[#f8faf7] p-4 shadow-sm dark:border-[#33463a] dark:bg-[#16231c]"
        >
            <CollapsibleTrigger className="flex w-full items-start justify-between gap-3 text-left">
                <div className="min-w-0">
                    <h2 className="font-semibold">{title}</h2>
                    <p className="text-sm text-muted-foreground">
                        {titleIsCompany ? '' : `${company} - `}analyzed{' '}
                        {formatDate(item.created_at)}
                    </p>
                    {item.resume_document ? (
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <FileText className="size-3" />
                            {item.resume_document.file_name}
                        </p>
                    ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <div className="rounded-full bg-[#17201b] px-3 py-2 text-sm font-semibold whitespace-nowrap text-[#f4f8f2] dark:bg-[#f3c76a] dark:text-[#17201b]">
                        {item.match_score}% match
                    </div>
                    <ChevronDown
                        className={`size-4 text-muted-foreground transition-transform ${
                            isOpen ? 'rotate-180' : ''
                        }`}
                    />
                </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
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
            </CollapsibleContent>
        </Collapsible>
    );
}

AnalyzeResume.layout = {
    breadcrumbs: [{ title: 'Analyze Job & Resume', href: '/analyze-resume' }],
};
