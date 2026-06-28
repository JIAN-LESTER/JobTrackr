import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    BriefcaseBusiness,
    Handshake,
    MessagesSquare,
    Plus,
    Search,
    Send,
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

export default function Applications({
    applications,
    stats,
    filters,
    statuses,
}: Props) {
    const [isAddOpen, setIsAddOpen] = useState(false);
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

    const changeStatus = (status: string) => {
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
                                                    {visibleStatuses.map((status) => (
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
                        onClick={() => changeStatus('all')}
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
                            onClick={() => changeStatus(status)}
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
                            onValueChange={changeStatus}
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
                            render: (application) => companyName(application),
                        },
                        {
                            key: 'job_title',
                            label: 'Job title',
                            render: (application) => application.job_title,
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
                    ]}
                    renderCard={(application) => (
                        <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="font-medium">
                                        {application.job_title}
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        {companyName(application)}
                                    </p>
                                </div>
                                <Badge variant="secondary">
                                    {statusLabel(application.status)}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {formatDate(application.applied_date)}
                            </p>
                        </div>
                    )}
                    renderListItem={(application) => (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-medium">
                                        {application.job_title}
                                    </span>
                                    <Badge variant="outline">
                                        {statusLabel(application.status)}
                                    </Badge>
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {companyName(application)}
                                </p>
                            </div>
                            <p className="text-xs text-muted-foreground sm:text-right">
                                {formatDate(application.applied_date)}
                            </p>
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
