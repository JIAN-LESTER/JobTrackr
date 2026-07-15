import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Ban,
    Bell,
    BriefcaseBusiness,
    Bookmark,
    ChevronDown,
    Edit,
    ExternalLink,
    MessagesSquare,
    Plus,
    Search,
    Send,
    Sparkles,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { PreferredView } from '@/components/preferred-view';
import { StatCard } from '@/components/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
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
import { cn } from '@/lib/utils';
import type { Application } from '@/types/Application';

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Paginated<T> = {
    data: T[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
};

type Filters = {
    search?: string;
    status?: string;
    per_page?: string;
};

type ApplicationStats = {
    total: number;
    applied: number;
    interviewing: number;
    rejected: number;
};

type Props = {
    applications: Paginated<Application>;
    stats: ApplicationStats;
    statusCounts: Record<string, number>;
    filters: Filters;
    statuses: string[];
};

type ApplicationForm = {
    company: string;
    company_industry: string;
    job_title: string;
    job_type: string;
    work_setup: string;
    location: string;
    salary_min: string;
    salary_max: string;
    status: string;
    applied_date: string;
    job_post_url: string;
    job_description: string;
};

type ReminderForm = {
    job_application_id: number | '';
    title: string;
    description: string;
    remind_at: string;
};

type ApplicationValidationErrors = Partial<
    Record<keyof ApplicationForm, string>
>;

const statusLabel = (status: string) =>
    status
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

const formatDate = (value: string | null) =>
    value
        ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
              new Date(value),
          )
        : 'No date';

const companyName = (application: Application) =>
    application.company?.name || 'Unknown company';

const escapeRegExp = (value: string) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const websiteLabel = (url: string | null) => {
    if (!url) {
        return 'Website';
    }

    try {
        return new URL(url).hostname.replace(/^www\./, '') || 'Website';
    } catch {
        return 'Website';
    }
};

const isSiteLabel = (label: string, website: string) =>
    ['linkedin', 'linkedin.com', website.toLowerCase()].includes(
        label.toLowerCase(),
    );

const applicationDisplay = (application: Application) => {
    const website = application.job_post_url
        ? websiteLabel(application.job_post_url)
        : '';
    const storedCompany = companyName(application);
    const hasRealCompany =
        !['Imported', 'Unknown company', 'Website'].includes(storedCompany) &&
        !isSiteLabel(storedCompany, website);
    const parts = application.job_title
        .split('|')
        .map((part) => part.trim())
        .filter(Boolean);

    while (
        parts.length > 1 &&
        isSiteLabel(parts[parts.length - 1] || '', website)
    ) {
        parts.pop();
    }

    let company = hasRealCompany ? storedCompany : 'Unknown company';

    if (parts.length > 1) {
        const lastPart = parts[parts.length - 1] || '';

        if (
            !hasRealCompany ||
            lastPart.toLowerCase() === storedCompany.toLowerCase()
        ) {
            company = lastPart;
            parts.pop();
        }
    }

    [company, website]
        .filter((label) => label && !isSiteLabel(label, website))
        .forEach((label) => {
            const lastIndex = parts.length - 1;

            if (
                lastIndex >= 0 &&
                (parts[lastIndex] || '').toLowerCase() === label.toLowerCase()
            ) {
                parts.pop();
            }
        });

    let title = parts.join(' | ') || application.job_title;
    [company, website]
        .filter((label) => label && !isSiteLabel(label, website))
        .forEach((label) => {
            title = title
                .replace(
                    new RegExp(
                        `\\s*(?:\\||-| at )\\s*${escapeRegExp(label)}\\s*$`,
                        'i',
                    ),
                    '',
                )
                .trim();
        });

    return {
        title:
            title && title !== 'Imported job' && !isSiteLabel(title, website)
                ? title
                : 'Application',
        company,
    };
};

const applicationTitle = (application: Application) =>
    applicationDisplay(application).title;

const applicationCompanyName = (application: Application) =>
    applicationDisplay(application).company;

const cleanPageLabel = (label: string) =>
    label
        .replace('&laquo; Previous', 'Previous')
        .replace('Next &raquo;', 'Next');

const filterButtonStatuses = [
    'applied',
    'saved',
    'assessment',
    'interviewing',
    'offer',
];

const optionalSelectNone = '__none';

const industries = [
    'Accounting',
    'Advertising',
    'Business Process Outsourcing',
    'Construction',
    'Education',
    'Finance',
    'Healthcare',
    'Hospitality',
    'Information Technology',
    'Manufacturing',
    'Retail',
    'Telecommunications',
    'Transportation',
];

const jobTypes = [
    'Full-time',
    'Part-time',
    'Contract',
    'Freelance',
    'Internship',
    'Temporary',
];

const workSetups = ['On-site', 'Hybrid', 'Remote'];

const statusBadgeClass = (status: string) => {
    switch (status) {
        case 'applied':
            return 'border-[#2f6f4f]/15 bg-[#dcefe4] text-[#24543d] dark:bg-[#2f6f4f]/25 dark:text-[#b8e6ca]';
        case 'saved':
            return 'border-[#8f6a1f]/15 bg-[#f8edcf] text-[#755516] dark:bg-[#f3c76a]/20 dark:text-[#f8d98a]';
        case 'assessment':
            return 'border-[#2f6d7c]/15 bg-[#d9edf1] text-[#245867] dark:bg-[#2f6d7c]/25 dark:text-[#b5e2eb]';
        case 'interviewing':
            return 'border-[#5b4b8a]/15 bg-[#e6e1f2] text-[#4a3d75] dark:bg-[#5b4b8a]/30 dark:text-[#d8cff5]';
        case 'offer':
            return 'border-[#7a5b1c]/15 bg-[#f6e6b8] text-[#654914] dark:bg-[#f3c76a]/25 dark:text-[#ffe7a3]';
        case 'rejected':
            return 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300';
        default:
            return 'border-[#cbd8cf] bg-[#eef3ef] text-[#324338] dark:border-[#33463a] dark:bg-[#213128] dark:text-[#d8e2da]';
    }
};

const toDateTimeLocal = (date: Date) => {
    const localDate = new Date(
        date.getTime() - date.getTimezoneOffset() * 60000,
    );

    return localDate.toISOString().slice(0, 16);
};

const defaultReminderAt = () => {
    const date = new Date();

    date.setDate(date.getDate() + 1);
    date.setHours(9, 0, 0, 0);

    return toDateTimeLocal(date);
};

const validateApplicationForm = (data: ApplicationForm) => {
    const errors: ApplicationValidationErrors = {};
    const salaryMin = data.salary_min.trim();
    const salaryMax = data.salary_max.trim();
    const jobPostUrl = data.job_post_url.trim();
    const appliedDate = data.applied_date.trim();

    if (!data.company.trim()) {
        errors.company = 'Company is required.';
    }

    if (!data.job_title.trim()) {
        errors.job_title = 'Job title is required.';
    }

    if (
        salaryMin &&
        (Number.isNaN(Number(salaryMin)) || Number(salaryMin) < 0)
    ) {
        errors.salary_min = 'Salary min must be a nonnegative number.';
    }

    if (
        salaryMax &&
        (Number.isNaN(Number(salaryMax)) || Number(salaryMax) < 0)
    ) {
        errors.salary_max = 'Salary max must be a nonnegative number.';
    }

    if (
        salaryMin &&
        salaryMax &&
        !errors.salary_min &&
        !errors.salary_max &&
        Number(salaryMax) < Number(salaryMin)
    ) {
        errors.salary_max =
            'Salary max must be greater than or equal to salary min.';
    }

    if (jobPostUrl) {
        try {
            new URL(jobPostUrl);
        } catch {
            errors.job_post_url =
                'Enter a valid URL, including http:// or https://.';
        }

        if (jobPostUrl.length > 255) {
            errors.job_post_url =
                'Job post URL must be 255 characters or fewer.';
        }
    }

    if (appliedDate && Number.isNaN(Date.parse(appliedDate))) {
        errors.applied_date = 'Enter a valid date.';
    }

    return errors;
};

export default function Applications({
    applications,
    stats,
    statusCounts,
    filters,
    statuses,
}: Props) {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingApplication, setEditingApplication] =
        useState<Application | null>(null);
    const [selectedApplication, setSelectedApplication] =
        useState<Application | null>(null);
    const [isSelectedDescriptionOpen, setIsSelectedDescriptionOpen] =
        useState(false);
    const [reminderApplication, setReminderApplication] =
        useState<Application | null>(null);
    const [deletingApplication, setDeletingApplication] =
        useState<Application | null>(null);
    const [search, setSearch] = useState(filters.search || '');
    const [addFormErrors, setAddFormErrors] =
        useState<ApplicationValidationErrors>({});
    const [editFormErrors, setEditFormErrors] =
        useState<ApplicationValidationErrors>({});
    const selectedStatus = filters.status || 'all';
    const selectedApplicationDescription =
        selectedApplication?.job_description?.trim() || '';
    const visibleStatuses = filterButtonStatuses.filter((status) =>
        statuses.includes(status),
    );
    const moreStatuses = statuses.filter(
        (status) => !visibleStatuses.includes(status),
    );
    const isMoreStatusSelected = moreStatuses.includes(selectedStatus);
    const statCards = [
        {
            title: 'Total',
            value: stats.total,
            icon: BriefcaseBusiness,
            iconClassName:
                'bg-[#17201b] text-[#f4f8f2] dark:bg-[#f3c76a] dark:text-[#17201b]',
        },
        {
            title: 'Applied',
            value: stats.applied,
            icon: Send,
            iconClassName:
                'bg-[#d5eadc] text-[#2f6f4f] dark:bg-[#2f6f4f]/30 dark:text-[#b8e6ca]',
        },
        {
            title: 'Interviews',
            value: stats.interviewing,
            icon: MessagesSquare,
            iconClassName:
                'bg-[#e2dbf3] text-[#5b4b8a] dark:bg-[#5b4b8a]/30 dark:text-[#d8cff5]',
        },
        {
            title: 'Rejected',
            value: stats.rejected,
            icon: Ban,
            iconClassName:
                'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300',
        },
    ];
    const form = useForm<ApplicationForm>({
        company: '',
        company_industry: '',
        job_title: '',
        job_type: '',
        work_setup: '',
        location: '',
        salary_min: '',
        salary_max: '',
        status: 'applied',
        applied_date: '',
        job_post_url: '',
        job_description: '',
    });
    const editForm = useForm<ApplicationForm>({
        company: '',
        company_industry: '',
        job_title: '',
        job_type: '',
        work_setup: '',
        location: '',
        salary_min: '',
        salary_max: '',
        status: 'applied',
        applied_date: '',
        job_post_url: '',
        job_description: '',
    });
    const reminderForm = useForm<ReminderForm>({
        job_application_id: '',
        title: '',
        description: '',
        remind_at: defaultReminderAt(),
    });

    const changeFilterStatus = (status: string) => {
        router.get(
            '/applications',
            {
                ...filters,
                status: status === 'all' ? undefined : status,
            },
            { preserveState: true, replace: true },
        );
    };
    const statusCount = (status: string) =>
        status === 'all' ? stats.total : statusCounts[status] || 0;

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(
            '/applications',
            { ...filters, search: search || undefined },
            { preserveState: true, replace: true },
        );
    };

    const submitApplication = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const validationErrors = validateApplicationForm(form.data);

        setAddFormErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            return;
        }

        form.post('/applications', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                form.setData('status', 'applied');
                setAddFormErrors({});
                setIsAddOpen(false);
            },
        });
    };

    const setAddFormData = (field: keyof ApplicationForm, value: string) => {
        const nextData = { ...form.data, [field]: value };

        form.setData(field, value);
        form.clearErrors(field);

        if (Object.keys(addFormErrors).length > 0) {
            setAddFormErrors(validateApplicationForm(nextData));
        }
    };

    const addFormError = (field: keyof ApplicationForm) =>
        addFormErrors[field] || form.errors[field];

    const setAddDialogOpen = (open: boolean) => {
        setIsAddOpen(open);

        if (!open) {
            setAddFormErrors({});
        }
    };

    const openEditApplication = (application: Application) => {
        setEditingApplication(application);
        editForm.clearErrors();
        setEditFormErrors({});
        editForm.setData({
            company: companyName(application),
            company_industry: application.company?.industry || '',
            job_title: application.job_title,
            job_type: application.job_type || '',
            work_setup: application.work_setup || '',
            location: application.location || '',
            salary_min: application.salary_min || '',
            salary_max: application.salary_max || '',
            status: application.status,
            applied_date: application.applied_date?.slice(0, 10) || '',
            job_post_url: application.job_post_url || '',
            job_description: application.job_description || '',
        });
    };

    const submitEditApplication = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!editingApplication) {
            return;
        }

        const validationErrors = validateApplicationForm(editForm.data);

        setEditFormErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            return;
        }

        editForm.put(`/applications/${editingApplication.application_id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditFormErrors({});
                setEditingApplication(null);
            },
        });
    };

    const setEditFormData = (field: keyof ApplicationForm, value: string) => {
        const nextData = { ...editForm.data, [field]: value };

        editForm.setData(field, value);
        editForm.clearErrors(field);

        if (Object.keys(editFormErrors).length > 0) {
            setEditFormErrors(validateApplicationForm(nextData));
        }
    };

    const editFormError = (field: keyof ApplicationForm) =>
        editFormErrors[field] || editForm.errors[field];

    const openReminder = (application: Application) => {
        setReminderApplication(application);
        reminderForm.clearErrors();
        reminderForm.setData({
            job_application_id: application.application_id,
            title: `${applicationTitle(application)}`,
            description: '',
            remind_at: defaultReminderAt(),
        });
    };

    const submitReminder = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        reminderForm.post('/reminders', {
            preserveScroll: true,
            onSuccess: () => {
                reminderForm.reset();
                reminderForm.setData('remind_at', defaultReminderAt());
                setReminderApplication(null);
            },
        });
    };

    const updateApplicationStatus = (
        application: Application,
        status: string,
    ) => {
        router.patch(
            `/applications/${application.application_id}`,
            { status },
            { preserveScroll: true },
        );
    };

    const deleteApplication = () => {
        if (!deletingApplication) {
            return;
        }

        router.delete(`/applications/${deletingApplication.application_id}`, {
            preserveScroll: true,
            onSuccess: () => setDeletingApplication(null),
        });
    };

    const applicationActions = (application: Application) => (
        <div
            className="flex flex-wrap items-center gap-2"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
        >
            <Select
                value={application.status}
                onValueChange={(status) =>
                    updateApplicationStatus(application, status)
                }
            >
                <SelectTrigger className="h-8 w-[160px] border-[#cbd8cf] bg-white/80 dark:border-[#33463a] dark:bg-[#213128]/70">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {statuses.map((status) => (
                        <SelectItem key={status} value={status}>
                            {statusLabel(status)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button
                asChild
                type="button"
                variant="outline"
                size="icon"
                className="size-8 border-[#cbd8cf] bg-white/80 text-[#8f6a1f] hover:bg-[#f8edcf] dark:border-[#33463a] dark:bg-[#213128]/70 dark:text-[#f8d98a]"
                aria-label="Analyze job and resume"
            >
                <Link
                    href={`/analyze-resume?application=${application.application_id}`}
                >
                    <Sparkles className="size-4" />
                </Link>
            </Button>
            <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8 border-[#cbd8cf] bg-white/80 text-[#2f6f4f] hover:bg-[#dcefe4] dark:border-[#33463a] dark:bg-[#213128]/70 dark:text-[#b8e6ca]"
                aria-label="Add reminder"
                onClick={() => openReminder(application)}
            >
                <Bell className="size-4" />
            </Button>
            <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8 border-[#cbd8cf] bg-white/80 text-[#5b4b8a] hover:bg-[#e6e1f2] dark:border-[#33463a] dark:bg-[#213128]/70 dark:text-[#d8cff5]"
                aria-label="Edit application"
                onClick={() => openEditApplication(application)}
            >
                <Edit className="size-4" />
            </Button>
            <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8 border-red-100 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
                aria-label="Delete application"
                onClick={() => setDeletingApplication(application)}
            >
                <Trash2 className="size-4" />
            </Button>
        </div>
    );

    return (
        <>
            <Head title="Applications" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto bg-[#eef3ef] p-4 dark:bg-background">
                <div className="rounded-lg border border-[#cbd8cf] bg-[#f8faf7] p-4 shadow-sm shadow-[#17201b]/5 dark:border-[#33463a] dark:bg-[#16231c]">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight">
                                Applications
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                View your job applications and track their
                                progress.
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                            <form
                                onSubmit={submitSearch}
                                className="flex w-full gap-2 sm:w-80"
                            >
                                <Input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search applications"
                                    className="h-9 bg-white/80 dark:bg-[#0f1713]/40"
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    aria-label="Search"
                                >
                                    <Search className="size-4" />
                                </Button>
                            </form>

                            <Button
                                asChild
                                variant="outline"
                                className="border-[#cbd8cf] bg-white/70 dark:border-[#33463a] dark:bg-[#213128]/70"
                            >
                                <Link href="/applications/import">
                                    <Bookmark className="size-4" />
                                    Import
                                </Link>
                            </Button>

                            <Dialog
                                open={isAddOpen}
                                onOpenChange={setAddDialogOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button
                                        type="button"
                                        className="bg-[#17201b] text-[#f4f8f2] hover:bg-[#2d3b31] dark:bg-[#f3c76a] dark:text-[#17201b] dark:hover:bg-[#e0b657]"
                                    >
                                        <Plus className="size-4" />
                                        Add
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>
                                            Add application
                                        </DialogTitle>
                                        <DialogDescription>
                                            Track a new company and role.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <form
                                        onSubmit={submitApplication}
                                        className="space-y-4"
                                        noValidate
                                    >
                                        <div className="space-y-2">
                                            <Label htmlFor="company">
                                                Company
                                            </Label>
                                            <Input
                                                id="company"
                                                value={form.data.company}
                                                onChange={(event) =>
                                                    setAddFormData(
                                                        'company',
                                                        event.target.value,
                                                    )
                                                }
                                                required
                                            />
                                            {addFormError('company') ? (
                                                <p className="text-sm text-destructive">
                                                    {addFormError('company')}
                                                </p>
                                            ) : null}
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label>Industry</Label>
                                                <Select
                                                    value={
                                                        form.data
                                                            .company_industry ||
                                                        optionalSelectNone
                                                    }
                                                    onValueChange={(value) =>
                                                        setAddFormData(
                                                            'company_industry',
                                                            value ===
                                                                optionalSelectNone
                                                                ? ''
                                                                : value,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select industry" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem
                                                            value={
                                                                optionalSelectNone
                                                            }
                                                        >
                                                            Not specified
                                                        </SelectItem>
                                                        {industries.map(
                                                            (industry) => (
                                                                <SelectItem
                                                                    key={
                                                                        industry
                                                                    }
                                                                    value={
                                                                        industry
                                                                    }
                                                                >
                                                                    {industry}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                {addFormError(
                                                    'company_industry',
                                                ) ? (
                                                    <p className="text-sm text-destructive">
                                                        {addFormError(
                                                            'company_industry',
                                                        )}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="job_title">
                                                Job title
                                            </Label>
                                            <Input
                                                id="job_title"
                                                value={form.data.job_title}
                                                onChange={(event) =>
                                                    setAddFormData(
                                                        'job_title',
                                                        event.target.value,
                                                    )
                                                }
                                                required
                                            />
                                            {addFormError('job_title') ? (
                                                <p className="text-sm text-destructive">
                                                    {addFormError('job_title')}
                                                </p>
                                            ) : null}
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label>Job type</Label>
                                                <Select
                                                    value={
                                                        form.data.job_type ||
                                                        optionalSelectNone
                                                    }
                                                    onValueChange={(value) =>
                                                        setAddFormData(
                                                            'job_type',
                                                            value ===
                                                                optionalSelectNone
                                                                ? ''
                                                                : value,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select job type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem
                                                            value={
                                                                optionalSelectNone
                                                            }
                                                        >
                                                            Not specified
                                                        </SelectItem>
                                                        {jobTypes.map(
                                                            (jobType) => (
                                                                <SelectItem
                                                                    key={
                                                                        jobType
                                                                    }
                                                                    value={
                                                                        jobType
                                                                    }
                                                                >
                                                                    {jobType}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                {addFormError('job_type') ? (
                                                    <p className="text-sm text-destructive">
                                                        {addFormError(
                                                            'job_type',
                                                        )}
                                                    </p>
                                                ) : null}
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Work setup</Label>
                                                <Select
                                                    value={
                                                        form.data.work_setup ||
                                                        optionalSelectNone
                                                    }
                                                    onValueChange={(value) =>
                                                        setAddFormData(
                                                            'work_setup',
                                                            value ===
                                                                optionalSelectNone
                                                                ? ''
                                                                : value,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select work setup" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem
                                                            value={
                                                                optionalSelectNone
                                                            }
                                                        >
                                                            Not specified
                                                        </SelectItem>
                                                        {workSetups.map(
                                                            (workSetup) => (
                                                                <SelectItem
                                                                    key={
                                                                        workSetup
                                                                    }
                                                                    value={
                                                                        workSetup
                                                                    }
                                                                >
                                                                    {workSetup}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                {addFormError('work_setup') ? (
                                                    <p className="text-sm text-destructive">
                                                        {addFormError(
                                                            'work_setup',
                                                        )}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="location">
                                                Location
                                            </Label>
                                            <Input
                                                id="location"
                                                value={form.data.location}
                                                onChange={(event) =>
                                                    setAddFormData(
                                                        'location',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                            {addFormError('location') ? (
                                                <p className="text-sm text-destructive">
                                                    {addFormError('location')}
                                                </p>
                                            ) : null}
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="salary_min">
                                                    Salary min
                                                </Label>
                                                <Input
                                                    id="salary_min"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={form.data.salary_min}
                                                    onChange={(event) =>
                                                        setAddFormData(
                                                            'salary_min',
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                                {addFormError('salary_min') ? (
                                                    <p className="text-sm text-destructive">
                                                        {addFormError(
                                                            'salary_min',
                                                        )}
                                                    </p>
                                                ) : null}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="salary_max">
                                                    Salary max
                                                </Label>
                                                <Input
                                                    id="salary_max"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={form.data.salary_max}
                                                    onChange={(event) =>
                                                        setAddFormData(
                                                            'salary_max',
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                                {addFormError('salary_max') ? (
                                                    <p className="text-sm text-destructive">
                                                        {addFormError(
                                                            'salary_max',
                                                        )}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="job_post_url">
                                                Job post URL
                                            </Label>
                                            <Input
                                                id="job_post_url"
                                                type="url"
                                                value={form.data.job_post_url}
                                                onChange={(event) =>
                                                    setAddFormData(
                                                        'job_post_url',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                            {addFormError('job_post_url') ? (
                                                <p className="text-sm text-destructive">
                                                    {addFormError(
                                                        'job_post_url',
                                                    )}
                                                </p>
                                            ) : null}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="job_description">
                                                Job description
                                            </Label>
                                            <textarea
                                                id="job_description"
                                                value={
                                                    form.data.job_description
                                                }
                                                rows={6}
                                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                                onChange={(event) =>
                                                    setAddFormData(
                                                        'job_description',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label>Status</Label>
                                                <Select
                                                    value={form.data.status}
                                                    onValueChange={(value) =>
                                                        setAddFormData(
                                                            'status',
                                                            value,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {statuses.map(
                                                            (status) => (
                                                                <SelectItem
                                                                    key={status}
                                                                    value={
                                                                        status
                                                                    }
                                                                >
                                                                    {statusLabel(
                                                                        status,
                                                                    )}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                {addFormError('status') ? (
                                                    <p className="text-sm text-destructive">
                                                        {addFormError('status')}
                                                    </p>
                                                ) : null}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="applied_date">
                                                    Date
                                                </Label>
                                                <Input
                                                    id="applied_date"
                                                    type="date"
                                                    value={
                                                        form.data.applied_date
                                                    }
                                                    onChange={(event) =>
                                                        setAddFormData(
                                                            'applied_date',
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                                {addFormError(
                                                    'applied_date',
                                                ) ? (
                                                    <p className="text-sm text-destructive">
                                                        {addFormError(
                                                            'applied_date',
                                                        )}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>

                                        <DialogFooter>
                                            <Button
                                                type="submit"
                                                disabled={form.processing}
                                            >
                                                {form.processing ? (
                                                    <Spinner />
                                                ) : null}
                                                Save
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>

                            <Dialog
                                open={Boolean(editingApplication)}
                                onOpenChange={(open) => {
                                    if (!open) {
                                        setEditFormErrors({});
                                        setEditingApplication(null);
                                    }
                                }}
                            >
                                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>
                                            Edit application
                                        </DialogTitle>
                                        <DialogDescription>
                                            Update the tracked role.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <form
                                        onSubmit={submitEditApplication}
                                        className="space-y-4"
                                        noValidate
                                    >
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="edit_company">
                                                    Company
                                                </Label>
                                                <Input
                                                    id="edit_company"
                                                    value={
                                                        editForm.data.company
                                                    }
                                                    onChange={(event) =>
                                                        setEditFormData(
                                                            'company',
                                                            event.target.value,
                                                        )
                                                    }
                                                    required
                                                />
                                                {editFormError('company') ? (
                                                    <p className="text-sm text-destructive">
                                                        {editFormError(
                                                            'company',
                                                        )}
                                                    </p>
                                                ) : null}
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Industry</Label>
                                                <Select
                                                    value={
                                                        editForm.data
                                                            .company_industry ||
                                                        optionalSelectNone
                                                    }
                                                    onValueChange={(value) =>
                                                        editForm.setData(
                                                            'company_industry',
                                                            value ===
                                                                optionalSelectNone
                                                                ? ''
                                                                : value,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem
                                                            value={
                                                                optionalSelectNone
                                                            }
                                                        >
                                                            Not specified
                                                        </SelectItem>
                                                        {industries.map(
                                                            (industry) => (
                                                                <SelectItem
                                                                    key={
                                                                        industry
                                                                    }
                                                                    value={
                                                                        industry
                                                                    }
                                                                >
                                                                    {industry}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="edit_job_title">
                                                Job title
                                            </Label>
                                            <Input
                                                id="edit_job_title"
                                                value={editForm.data.job_title}
                                                onChange={(event) =>
                                                    setEditFormData(
                                                        'job_title',
                                                        event.target.value,
                                                    )
                                                }
                                                required
                                            />
                                            {editFormError('job_title') ? (
                                                <p className="text-sm text-destructive">
                                                    {editFormError('job_title')}
                                                </p>
                                            ) : null}
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label>Job type</Label>
                                                <Select
                                                    value={
                                                        editForm.data
                                                            .job_type ||
                                                        optionalSelectNone
                                                    }
                                                    onValueChange={(value) =>
                                                        editForm.setData(
                                                            'job_type',
                                                            value ===
                                                                optionalSelectNone
                                                                ? ''
                                                                : value,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem
                                                            value={
                                                                optionalSelectNone
                                                            }
                                                        >
                                                            Not specified
                                                        </SelectItem>
                                                        {jobTypes.map(
                                                            (jobType) => (
                                                                <SelectItem
                                                                    key={
                                                                        jobType
                                                                    }
                                                                    value={
                                                                        jobType
                                                                    }
                                                                >
                                                                    {jobType}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Work setup</Label>
                                                <Select
                                                    value={
                                                        editForm.data
                                                            .work_setup ||
                                                        optionalSelectNone
                                                    }
                                                    onValueChange={(value) =>
                                                        editForm.setData(
                                                            'work_setup',
                                                            value ===
                                                                optionalSelectNone
                                                                ? ''
                                                                : value,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem
                                                            value={
                                                                optionalSelectNone
                                                            }
                                                        >
                                                            Not specified
                                                        </SelectItem>
                                                        {workSetups.map(
                                                            (workSetup) => (
                                                                <SelectItem
                                                                    key={
                                                                        workSetup
                                                                    }
                                                                    value={
                                                                        workSetup
                                                                    }
                                                                >
                                                                    {workSetup}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="edit_location">
                                                    Location
                                                </Label>
                                                <Input
                                                    id="edit_location"
                                                    value={
                                                        editForm.data.location
                                                    }
                                                    onChange={(event) =>
                                                        editForm.setData(
                                                            'location',
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit_job_post_url">
                                                    Job post URL
                                                </Label>
                                                <Input
                                                    id="edit_job_post_url"
                                                    type="url"
                                                    value={
                                                        editForm.data
                                                            .job_post_url
                                                    }
                                                    onChange={(event) =>
                                                        setEditFormData(
                                                            'job_post_url',
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                                {editFormError(
                                                    'job_post_url',
                                                ) ? (
                                                    <p className="text-sm text-destructive">
                                                        {editFormError(
                                                            'job_post_url',
                                                        )}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="edit_job_description">
                                                Job description
                                            </Label>
                                            <textarea
                                                id="edit_job_description"
                                                value={
                                                    editForm.data
                                                        .job_description
                                                }
                                                rows={6}
                                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                                onChange={(event) =>
                                                    setEditFormData(
                                                        'job_description',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="edit_salary_min">
                                                    Salary min
                                                </Label>
                                                <Input
                                                    id="edit_salary_min"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={
                                                        editForm.data.salary_min
                                                    }
                                                    onChange={(event) =>
                                                        setEditFormData(
                                                            'salary_min',
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                                {editFormError('salary_min') ? (
                                                    <p className="text-sm text-destructive">
                                                        {editFormError(
                                                            'salary_min',
                                                        )}
                                                    </p>
                                                ) : null}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit_salary_max">
                                                    Salary max
                                                </Label>
                                                <Input
                                                    id="edit_salary_max"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={
                                                        editForm.data.salary_max
                                                    }
                                                    onChange={(event) =>
                                                        setEditFormData(
                                                            'salary_max',
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                                {editFormError('salary_max') ? (
                                                    <p className="text-sm text-destructive">
                                                        {editFormError(
                                                            'salary_max',
                                                        )}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label>Status</Label>
                                                <Select
                                                    value={editForm.data.status}
                                                    onValueChange={(value) =>
                                                        editForm.setData(
                                                            'status',
                                                            value,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {statuses.map(
                                                            (status) => (
                                                                <SelectItem
                                                                    key={status}
                                                                    value={
                                                                        status
                                                                    }
                                                                >
                                                                    {statusLabel(
                                                                        status,
                                                                    )}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit_applied_date">
                                                    Date
                                                </Label>
                                                <Input
                                                    id="edit_applied_date"
                                                    type="date"
                                                    value={
                                                        editForm.data
                                                            .applied_date
                                                    }
                                                    onChange={(event) =>
                                                        setEditFormData(
                                                            'applied_date',
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                                {editFormError(
                                                    'applied_date',
                                                ) ? (
                                                    <p className="text-sm text-destructive">
                                                        {editFormError(
                                                            'applied_date',
                                                        )}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>

                                        <DialogFooter>
                                            <Button
                                                type="submit"
                                                disabled={editForm.processing}
                                            >
                                                {editForm.processing ? (
                                                    <Spinner />
                                                ) : null}
                                                Save
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>

                            <Dialog
                                open={Boolean(selectedApplication)}
                                onOpenChange={(open) => {
                                    if (!open) {
                                        setSelectedApplication(null);
                                        setIsSelectedDescriptionOpen(false);
                                    }
                                }}
                            >
                                <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
                                    {selectedApplication ? (
                                        <>
                                            <DialogHeader>
                                                <DialogTitle>
                                                    {applicationTitle(
                                                        selectedApplication,
                                                    )}
                                                </DialogTitle>
                                                <DialogDescription>
                                                    {applicationCompanyName(
                                                        selectedApplication,
                                                    )}
                                                </DialogDescription>
                                            </DialogHeader>

                                            <div className="space-y-4 text-sm">
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <div>
                                                        <div className="text-xs text-muted-foreground">
                                                            Status
                                                        </div>
                                                        <div>
                                                            {statusLabel(
                                                                selectedApplication.status,
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-muted-foreground">
                                                            Date
                                                        </div>
                                                        <div>
                                                            {formatDate(
                                                                selectedApplication.applied_date,
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-muted-foreground">
                                                            Type
                                                        </div>
                                                        <div>
                                                            {selectedApplication.job_type ||
                                                                'Not specified'}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-muted-foreground">
                                                            Work setup
                                                        </div>
                                                        <div>
                                                            {selectedApplication.work_setup ||
                                                                'Not specified'}
                                                        </div>
                                                    </div>
                                                    <div className="sm:col-span-2">
                                                        <div className="text-xs text-muted-foreground">
                                                            Location
                                                        </div>
                                                        <div>
                                                            {selectedApplication.location ||
                                                                'Not specified'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <Collapsible
                                                    open={
                                                        isSelectedDescriptionOpen
                                                    }
                                                    onOpenChange={
                                                        setIsSelectedDescriptionOpen
                                                    }
                                                    className="rounded-md border border-[#cbd8cf] dark:border-[#33463a]"
                                                >
                                                    <CollapsibleTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            className="h-auto w-full justify-between gap-3 px-3 py-2 text-left hover:bg-[#eef3ef] dark:hover:bg-[#213128]/70"
                                                        >
                                                            <span>
                                                                <span className="block text-xs text-muted-foreground">
                                                                    Job
                                                                    description
                                                                </span>
                                                                <span className="block font-normal text-foreground">
                                                                    {selectedApplicationDescription
                                                                        ? `${selectedApplicationDescription.length.toLocaleString()} characters`
                                                                        : 'No description saved'}
                                                                </span>
                                                            </span>
                                                            <ChevronDown
                                                                className={`size-4 shrink-0 text-muted-foreground transition-transform ${
                                                                    isSelectedDescriptionOpen
                                                                        ? 'rotate-180'
                                                                        : ''
                                                                }`}
                                                            />
                                                        </Button>
                                                    </CollapsibleTrigger>
                                                    <CollapsibleContent>
                                                        <div className="border-t border-[#cbd8cf] px-3 pt-2 pb-3 dark:border-[#33463a]">
                                                            {selectedApplicationDescription ? (
                                                                <p className="max-h-64 overflow-y-auto whitespace-pre-wrap text-muted-foreground">
                                                                    {
                                                                        selectedApplicationDescription
                                                                    }
                                                                </p>
                                                            ) : (
                                                                <p className="text-muted-foreground">
                                                                    Add a job
                                                                    description
                                                                    by editing
                                                                    this
                                                                    application.
                                                                </p>
                                                            )}
                                                        </div>
                                                    </CollapsibleContent>
                                                </Collapsible>

                                                {selectedApplication.job_post_url ? (
                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                        className="w-full"
                                                    >
                                                        <a
                                                            href={
                                                                selectedApplication.job_post_url
                                                            }
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            <ExternalLink className="size-4" />
                                                            {websiteLabel(
                                                                selectedApplication.job_post_url,
                                                            )}
                                                        </a>
                                                    </Button>
                                                ) : null}
                                            </div>
                                        </>
                                    ) : null}
                                </DialogContent>
                            </Dialog>

                            <Dialog
                                open={Boolean(reminderApplication)}
                                onOpenChange={(open) => {
                                    if (!open) {
                                        setReminderApplication(null);
                                    }
                                }}
                            >
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add reminder</DialogTitle>
                                        <DialogDescription>
                                            {reminderApplication
                                                ? applicationTitle(
                                                      reminderApplication,
                                                  )
                                                : 'Application reminder'}
                                        </DialogDescription>
                                    </DialogHeader>

                                    <form
                                        onSubmit={submitReminder}
                                        className="space-y-4"
                                    >
                                        <div className="space-y-2">
                                            <Label htmlFor="remind_at">
                                                Reminder date
                                            </Label>
                                            <Input
                                                id="remind_at"
                                                type="datetime-local"
                                                value={
                                                    reminderForm.data.remind_at
                                                }
                                                onChange={(event) =>
                                                    reminderForm.setData(
                                                        'remind_at',
                                                        event.target.value,
                                                    )
                                                }
                                                required
                                            />
                                            {reminderForm.errors.remind_at ? (
                                                <p className="text-sm text-destructive">
                                                    {
                                                        reminderForm.errors
                                                            .remind_at
                                                    }
                                                </p>
                                            ) : null}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="reminder_note">
                                                Notes
                                            </Label>
                                            <textarea
                                                id="reminder_note"
                                                value={
                                                    reminderForm.data
                                                        .description
                                                }
                                                onChange={(event) =>
                                                    reminderForm.setData(
                                                        'description',
                                                        event.target.value,
                                                    )
                                                }
                                                className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                            />
                                            {reminderForm.errors.description ? (
                                                <p className="text-sm text-destructive">
                                                    {
                                                        reminderForm.errors
                                                            .description
                                                    }
                                                </p>
                                            ) : null}
                                        </div>

                                        <DialogFooter>
                                            <Button
                                                type="submit"
                                                disabled={
                                                    reminderForm.processing
                                                }
                                            >
                                                {reminderForm.processing ? (
                                                    <Spinner />
                                                ) : null}
                                                Save
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>

                            <Dialog
                                open={Boolean(deletingApplication)}
                                onOpenChange={(open) => {
                                    if (!open) {
                                        setDeletingApplication(null);
                                    }
                                }}
                            >
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>
                                            Delete application
                                        </DialogTitle>
                                        <DialogDescription>
                                            This will delete{' '}
                                            {deletingApplication
                                                ? applicationTitle(
                                                      deletingApplication,
                                                  )
                                                : 'this application'}{' '}
                                            from your tracked applications.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                setDeletingApplication(null)
                                            }
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            onClick={deleteApplication}
                                        >
                                            Delete
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-lg border border-[#cbd8cf] bg-[#f8faf7] p-2 shadow-sm shadow-[#17201b]/5 sm:hidden dark:border-[#33463a] dark:bg-[#16231c]">
                    {statCards.map((stat) => {
                        const Icon = stat.icon;

                        return (
                            <div
                                key={stat.title}
                                className="flex items-center gap-2 rounded-md px-2 py-2"
                            >
                                <div
                                    className={cn(
                                        'flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground',
                                        stat.iconClassName,
                                    )}
                                >
                                    <Icon className="size-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-xs text-muted-foreground">
                                        {stat.title}
                                    </p>
                                    <p className="text-lg leading-none font-semibold">
                                        {stat.value}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="hidden gap-3 sm:grid sm:grid-cols-2 xl:grid-cols-4">
                    {statCards.map((stat) => (
                        <StatCard
                            key={stat.title}
                            title={stat.title}
                            value={stat.value}
                            icon={stat.icon}
                            iconClassName={stat.iconClassName}
                        />
                    ))}
                </div>

                <div className="flex flex-wrap gap-2 rounded-lg border border-[#cbd8cf] bg-[#f8faf7] p-2 shadow-sm shadow-[#17201b]/5 dark:border-[#33463a] dark:bg-[#16231c]">
                    <Button
                        type="button"
                        variant={
                            selectedStatus === 'all' ? 'secondary' : 'outline'
                        }
                        size="sm"
                        className={
                            selectedStatus === 'all'
                                ? 'bg-[#17201b] text-[#f4f8f2] hover:bg-[#2d3b31] dark:bg-[#f3c76a] dark:text-[#17201b] dark:hover:bg-[#e0b657]'
                                : 'border-[#cbd8cf] bg-white/70 dark:border-[#33463a] dark:bg-[#213128]/70'
                        }
                        onClick={() => changeFilterStatus('all')}
                    >
                        <span>All</span>
                        {selectedStatus === 'all' ? (
                            <span className="text-muted-foreground">
                                {statusCount('all')}
                            </span>
                        ) : null}
                    </Button>
                    {filterButtonStatuses.map((status) => (
                        <Button
                            key={status}
                            type="button"
                            variant={
                                selectedStatus === status
                                    ? 'secondary'
                                    : 'outline'
                            }
                            size="sm"
                            className={
                                selectedStatus === status
                                    ? statusBadgeClass(status)
                                    : 'border-[#cbd8cf] bg-white/70 dark:border-[#33463a] dark:bg-[#213128]/70'
                            }
                            onClick={() => changeFilterStatus(status)}
                        >
                            <span>{statusLabel(status)}</span>
                            {selectedStatus === status ? (
                                <span className="text-muted-foreground">
                                    {statusCount(status)}
                                </span>
                            ) : null}
                        </Button>
                    ))}
                    {moreStatuses.length > 0 ? (
                        <Select
                            value={
                                isMoreStatusSelected ? selectedStatus : 'more'
                            }
                            onValueChange={changeFilterStatus}
                        >
                            <SelectTrigger
                                size="sm"
                                className={
                                    isMoreStatusSelected
                                        ? statusBadgeClass(selectedStatus)
                                        : 'border-[#cbd8cf] bg-white/70 dark:border-[#33463a] dark:bg-[#213128]/70'
                                }
                            >
                                <SelectValue placeholder="More" />
                                {isMoreStatusSelected ? (
                                    <span className="text-muted-foreground">
                                        {statusCount(selectedStatus)}
                                    </span>
                                ) : null}
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="more" disabled>
                                    More
                                </SelectItem>
                                {moreStatuses.map((status) => (
                                    <SelectItem key={status} value={status}>
                                        {statusLabel(status)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : null}
                </div>

                <PreferredView
                    items={applications.data}
                    storageKey="jobtrackr.applications.preferred-view"
                    emptyState="No applications found."
                    getKey={(application) => application.application_id}
                    onItemClick={(application) => {
                        setIsSelectedDescriptionOpen(false);
                        setSelectedApplication(application);
                    }}
                    columns={[
                        {
                            key: 'company',
                            label: 'Company',
                            render: (application) =>
                                applicationCompanyName(application),
                        },
                        {
                            key: 'job_title',
                            label: 'Job title',
                            render: (application) =>
                                applicationTitle(application),
                        },
                        {
                            key: 'status',
                            label: 'Status',
                            render: (application) => (
                                <Badge
                                    variant="outline"
                                    className={statusBadgeClass(
                                        application.status,
                                    )}
                                >
                                    {statusLabel(application.status)}
                                </Badge>
                            ),
                        },
                        {
                            key: 'applied_date',
                            label: 'Date',
                            render: (application) =>
                                formatDate(application.applied_date),
                        },
                        {
                            key: 'actions',
                            label: 'Actions',
                            render: (application) =>
                                applicationActions(application),
                        },
                    ]}
                    renderCard={(application) => (
                        <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="font-medium">
                                        {applicationTitle(application)}
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        {applicationCompanyName(application)}
                                    </p>
                                </div>
                                <Badge
                                    variant="outline"
                                    className={statusBadgeClass(
                                        application.status,
                                    )}
                                >
                                    {statusLabel(application.status)}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {formatDate(application.applied_date)}
                            </p>
                            {application.job_post_url ? (
                                <a
                                    href={application.job_post_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                    onClick={(event) => event.stopPropagation()}
                                >
                                    <ExternalLink className="size-3.5" />
                                    {websiteLabel(application.job_post_url)}
                                </a>
                            ) : null}
                            {applicationActions(application)}
                        </div>
                    )}
                    renderListItem={(application) => (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-medium">
                                        {applicationTitle(application)}
                                    </span>
                                    <Badge
                                        variant="outline"
                                        className={statusBadgeClass(
                                            application.status,
                                        )}
                                    >
                                        {statusLabel(application.status)}
                                    </Badge>
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {applicationCompanyName(application)}
                                </p>
                            </div>
                            <div className="flex flex-col gap-2 sm:items-end">
                                <p className="text-xs text-muted-foreground sm:text-right">
                                    {formatDate(application.applied_date)}
                                </p>
                                {applicationActions(application)}
                            </div>
                        </div>
                    )}
                    viewSwitcherClassName="border-[#cbd8cf] bg-[#f8faf7] shadow-sm shadow-[#17201b]/5 dark:border-[#33463a] dark:bg-[#16231c]"
                    emptyStateClassName="border-[#aebfb3] bg-[#f8faf7] dark:border-[#33463a] dark:bg-[#16231c]"
                    cardClassName="border-[#cbd8cf] bg-[#f8faf7] shadow-md shadow-[#17201b]/10 hover:border-[#aebfb3] hover:bg-white/80 dark:border-[#33463a] dark:bg-[#16231c] dark:hover:border-[#f3c76a]/40 dark:hover:bg-[#1a2c22]"
                    listClassName="divide-[#cbd8cf] border-[#cbd8cf] bg-[#f8faf7] shadow-sm shadow-[#17201b]/5 dark:divide-[#33463a] dark:border-[#33463a] dark:bg-[#16231c]"
                    listItemClassName="hover:bg-[#eef3ef] dark:hover:bg-[#213128]"
                    tableClassName="border-[#cbd8cf] bg-[#f8faf7] shadow-sm shadow-[#17201b]/5 dark:border-[#33463a] dark:bg-[#16231c]"
                    tableHeadClassName="bg-[#e6ece7] text-[#4c5c52] dark:bg-[#213128] dark:text-[#afbeb4]"
                />

                {applications.links.length > 3 ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                        <p className="text-muted-foreground">
                            Showing {applications.from || 0} to{' '}
                            {applications.to || 0} of {applications.total}
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {applications.links.map((link, index) =>
                                link.url ? (
                                    <Button
                                        key={`${link.label}-${index}`}
                                        asChild
                                        variant={
                                            link.active ? 'secondary' : 'ghost'
                                        }
                                        size="sm"
                                    >
                                        <Link href={link.url}>
                                            {cleanPageLabel(link.label)}
                                        </Link>
                                    </Button>
                                ) : (
                                    <Button
                                        key={`${link.label}-${index}`}
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        disabled
                                    >
                                        {cleanPageLabel(link.label)}
                                    </Button>
                                ),
                            )}
                        </div>
                    </div>
                ) : null}
            </div>
        </>
    );
}

Applications.layout = {
    breadcrumbs: [
        {
            title: 'Applications',
            href: '/applications',
        },
    ],
};
