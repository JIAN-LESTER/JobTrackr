import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Bell,
    BriefcaseBusiness,
    Bookmark,
    Edit,
    ExternalLink,
    Handshake,
    MessagesSquare,
    Plus,
    Search,
    Send,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { PreferredView } from '@/components/preferred-view';
import { StatCard } from '@/components/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    offers: number;
};

type Props = {
    applications: Paginated<Application>;
    stats: ApplicationStats;
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
};

type ReminderForm = {
    job_application_id: number | '';
    title: string;
    description: string;
    remind_at: string;
};

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
    const hasRealCompany = ![
        'Imported',
        'Unknown company',
        'Website',
    ].includes(storedCompany) && !isSiteLabel(storedCompany, website);
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

        if (!hasRealCompany || lastPart.toLowerCase() === storedCompany.toLowerCase()) {
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
                .replace(new RegExp(`\\s*(?:\\||-| at )\\s*${escapeRegExp(label)}\\s*$`, 'i'), '')
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

export default function Applications({
    applications,
    stats,
    filters,
    statuses,
}: Props) {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingApplication, setEditingApplication] =
        useState<Application | null>(null);
    const [selectedApplication, setSelectedApplication] =
        useState<Application | null>(null);
    const [reminderApplication, setReminderApplication] =
        useState<Application | null>(null);
    const [deletingApplication, setDeletingApplication] =
        useState<Application | null>(null);
    const [search, setSearch] = useState(filters.search || '');
    const selectedStatus = filters.status || 'all';
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
        },
        {
            title: 'Applied',
            value: stats.applied,
            icon: Send,
        },
        {
            title: 'Interviews',
            value: stats.interviewing,
            icon: MessagesSquare,
        },
        {
            title: 'Offers',
            value: stats.offers,
            icon: Handshake,
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

        form.post('/applications', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                form.setData('status', 'applied');
                setIsAddOpen(false);
            },
        });
    };

    const openEditApplication = (application: Application) => {
        setEditingApplication(application);
        editForm.clearErrors();
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
        });
    };

    const submitEditApplication = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!editingApplication) {
            return;
        }

        editForm.put(`/applications/${editingApplication.application_id}`, {
            preserveScroll: true,
            onSuccess: () => setEditingApplication(null),
        });
    };

    const openReminder = (application: Application) => {
        setReminderApplication(application);
        reminderForm.clearErrors();
        reminderForm.setData({
            job_application_id: application.application_id,
            title: `Reminder: ${applicationTitle(application)}`,
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
        <div className="flex flex-wrap items-center gap-2">
            <Select
                value={application.status}
                onValueChange={(status) =>
                    updateApplicationStatus(application, status)
                }
            >
                <SelectTrigger className="h-8 w-[160px]">
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
                type="button"
                variant="outline"
                size="icon"
                className="size-8"
                aria-label="Add reminder"
                onClick={() => openReminder(application)}
            >
                <Bell className="size-4" />
            </Button>
            <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8"
                aria-label="Edit application"
                onClick={() => openEditApplication(application)}
            >
                <Edit className="size-4" />
            </Button>
            <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8 text-destructive"
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

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">
                            Applications
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {applications.total} tracked applications
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
                                className="h-9"
                            />
                            <Button
                                type="submit"
                                size="icon"
                                aria-label="Search"
                            >
                                <Search className="size-4" />
                            </Button>
                        </form>

                        <Button asChild variant="outline">
                            <Link href="/applications/import">
                                <Bookmark className="size-4" />
                                Import
                            </Link>
                        </Button>

                        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                            <DialogTrigger asChild>
                                <Button type="button">
                                    <Plus className="size-4" />
                                    Add
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Add application</DialogTitle>
                                    <DialogDescription>
                                        Track a new company and role.
                                    </DialogDescription>
                                </DialogHeader>

                                <form
                                    onSubmit={submitApplication}
                                    className="space-y-4"
                                >
                                    <div className="space-y-2">
                                        <Label htmlFor="company">
                                            Company
                                        </Label>
                                        <Input
                                            id="company"
                                            value={form.data.company}
                                            onChange={(event) =>
                                                form.setData(
                                                    'company',
                                                    event.target.value,
                                                )
                                            }
                                            required
                                        />
                                        {form.errors.company ? (
                                            <p className="text-sm text-destructive">
                                                {form.errors.company}
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
                                                    form.setData(
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
                                                                key={industry}
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
                                            {form.errors.company_industry ? (
                                                <p className="text-sm text-destructive">
                                                    {
                                                        form.errors
                                                            .company_industry
                                                    }
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
                                                form.setData(
                                                    'job_title',
                                                    event.target.value,
                                                )
                                            }
                                            required
                                        />
                                        {form.errors.job_title ? (
                                            <p className="text-sm text-destructive">
                                                {form.errors.job_title}
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
                                                    form.setData(
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
                                                    {jobTypes.map((jobType) => (
                                                        <SelectItem
                                                            key={jobType}
                                                            value={jobType}
                                                        >
                                                            {jobType}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {form.errors.job_type ? (
                                                <p className="text-sm text-destructive">
                                                    {form.errors.job_type}
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
                                                    form.setData(
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
                                                                key={workSetup}
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
                                            {form.errors.work_setup ? (
                                                <p className="text-sm text-destructive">
                                                    {form.errors.work_setup}
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
                                                form.setData(
                                                    'location',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        {form.errors.location ? (
                                            <p className="text-sm text-destructive">
                                                {form.errors.location}
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
                                                    form.setData(
                                                        'salary_min',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                            {form.errors.salary_min ? (
                                                <p className="text-sm text-destructive">
                                                    {form.errors.salary_min}
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
                                                    form.setData(
                                                        'salary_max',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                            {form.errors.salary_max ? (
                                                <p className="text-sm text-destructive">
                                                    {form.errors.salary_max}
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
                                                form.setData(
                                                    'job_post_url',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        {form.errors.job_post_url ? (
                                            <p className="text-sm text-destructive">
                                                {form.errors.job_post_url}
                                            </p>
                                        ) : null}
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Status</Label>
                                            <Select
                                                value={form.data.status}
                                                onValueChange={(value) =>
                                                    form.setData(
                                                        'status',
                                                        value,
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {statuses.map((status) => (
                                                        <SelectItem
                                                            key={status}
                                                            value={status}
                                                        >
                                                            {statusLabel(
                                                                status,
                                                            )}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {form.errors.status ? (
                                                <p className="text-sm text-destructive">
                                                    {form.errors.status}
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
                                                value={form.data.applied_date}
                                                onChange={(event) =>
                                                    form.setData(
                                                        'applied_date',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                            {form.errors.applied_date ? (
                                                <p className="text-sm text-destructive">
                                                    {form.errors.applied_date}
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
                                    setEditingApplication(null);
                                }
                            }}
                        >
                            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Edit application</DialogTitle>
                                    <DialogDescription>
                                        Update the tracked role.
                                    </DialogDescription>
                                </DialogHeader>

                                <form
                                    onSubmit={submitEditApplication}
                                    className="space-y-4"
                                >
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="edit_company">
                                                Company
                                            </Label>
                                            <Input
                                                id="edit_company"
                                                value={editForm.data.company}
                                                onChange={(event) =>
                                                    editForm.setData(
                                                        'company',
                                                        event.target.value,
                                                    )
                                                }
                                                required
                                            />
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
                                                                key={industry}
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
                                                editForm.setData(
                                                    'job_title',
                                                    event.target.value,
                                                )
                                            }
                                            required
                                        />
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Job type</Label>
                                            <Select
                                                value={
                                                    editForm.data.job_type ||
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
                                                    {jobTypes.map((jobType) => (
                                                        <SelectItem
                                                            key={jobType}
                                                            value={jobType}
                                                        >
                                                            {jobType}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Work setup</Label>
                                            <Select
                                                value={
                                                    editForm.data.work_setup ||
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
                                                                key={workSetup}
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
                                                value={editForm.data.location}
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
                                                    editForm.data.job_post_url
                                                }
                                                onChange={(event) =>
                                                    editForm.setData(
                                                        'job_post_url',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                        </div>
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
                                                    editForm.setData(
                                                        'salary_min',
                                                        event.target.value,
                                                    )
                                                }
                                            />
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
                                                    editForm.setData(
                                                        'salary_max',
                                                        event.target.value,
                                                    )
                                                }
                                            />
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
                                                    {statuses.map((status) => (
                                                        <SelectItem
                                                            key={status}
                                                            value={status}
                                                        >
                                                            {statusLabel(
                                                                status,
                                                            )}
                                                        </SelectItem>
                                                    ))}
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
                                                    editForm.data.applied_date
                                                }
                                                onChange={(event) =>
                                                    editForm.setData(
                                                        'applied_date',
                                                        event.target.value,
                                                    )
                                                }
                                            />
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
                                }
                            }}
                        >
                            <DialogContent className="sm:max-w-xl">
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

                                            {selectedApplication.job_description ? (
                                                <div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Description
                                                    </div>
                                                    <p className="mt-1 whitespace-pre-line">
                                                        {
                                                            selectedApplication.job_description
                                                        }
                                                    </p>
                                                </div>
                                            ) : null}

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
                                                        Website
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
                                                reminderForm.data.description
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
                                    <DialogTitle>Delete application</DialogTitle>
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

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {statCards.map((stat) => (
                        <StatCard
                            key={stat.title}
                            title={stat.title}
                            value={stat.value}
                            icon={stat.icon}
                        />
                    ))}
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        variant={selectedStatus === 'all' ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => changeFilterStatus('all')}
                    >
                        All
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
                            onClick={() => changeFilterStatus(status)}
                        >
                            {statusLabel(status)}
                        </Button>
                    ))}
                    {moreStatuses.length > 0 ? (
                        <Select
                            value={
                                isMoreStatusSelected
                                    ? selectedStatus
                                    : 'more'
                            }
                            onValueChange={changeFilterStatus}
                        >
                            <SelectTrigger
                                size="sm"
                                className={
                                    isMoreStatusSelected
                                        ? 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                        : ''
                                }
                            >
                                <SelectValue placeholder="More" />
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
                                <Badge variant="secondary">
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
                        <div
                            role="button"
                            tabIndex={0}
                            className="space-y-3 rounded-md outline-none transition hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            onClick={() => setSelectedApplication(application)}
                            onKeyDown={(event) => {
                                if (
                                    event.key === 'Enter' ||
                                    event.key === ' '
                                ) {
                                    event.preventDefault();
                                    setSelectedApplication(application);
                                }
                            }}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="font-medium">
                                        {applicationTitle(application)}
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        {applicationCompanyName(application)}
                                    </p>
                                </div>
                                <Badge variant="secondary">
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
                                    Website
                                </a>
                            ) : null}
                            <div
                                onClick={(event) => event.stopPropagation()}
                                onKeyDown={(event) => event.stopPropagation()}
                            >
                                {applicationActions(application)}
                            </div>
                        </div>
                    )}
                    renderListItem={(application) => (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-medium">
                                        {applicationTitle(application)}
                                    </span>
                                    <Badge variant="outline">
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
