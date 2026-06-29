import { Head, Link, router } from '@inertiajs/react';
import { Check, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { PreferredView } from '@/components/preferred-view';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Reminder } from '@/types/Reminder';

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
    job_application_id?: string;
    is_completed?: string;
    remind_from?: string;
    remind_to?: string;
    per_page?: string;
};

type Props = {
    reminders: Paginated<Reminder>;
    filters: Filters;
};

const formatDate = (value: string) =>
    new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));

const applicationTitle = (reminder: Reminder) =>
    reminder.job_application?.job_title || 'No application';

const companyName = (reminder: Reminder) =>
    reminder.job_application?.company?.name || 'Unknown company';

const reminderNote = (reminder: Reminder) => reminder.description?.trim();

const cleanPageLabel = (label: string) =>
    label
        .replace('&laquo; Previous', 'Previous')
        .replace('Next &raquo;', 'Next');

export default function RemindersIndex({ reminders, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const selectedStatus =
        filters.is_completed === '1' || filters.is_completed === 'true'
            ? 'done'
            : filters.is_completed === '0' || filters.is_completed === 'false'
              ? 'pending'
              : 'all';

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(
            '/reminders',
            { ...filters, search: search || undefined },
            { preserveState: true, replace: true },
        );
    };

    const changeStatusFilter = (status: string) => {
        router.get(
            '/reminders',
            {
                ...filters,
                is_completed:
                    status === 'all'
                        ? undefined
                        : status === 'done'
                          ? '1'
                          : '0',
            },
            { preserveState: true, replace: true },
        );
    };

    const markReminderDone = (reminder: Reminder) => {
        router.patch(
            `/reminders/${reminder.reminder_id}`,
            { is_completed: true },
            { preserveScroll: true },
        );
    };

    const deleteReminder = (reminder: Reminder) => {
        router.delete(`/reminders/${reminder.reminder_id}`, {
            preserveScroll: true,
        });
    };

    const reminderActions = (reminder: Reminder) => (
        <div className="flex flex-wrap items-center gap-2">
            {reminder.is_completed ? (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => deleteReminder(reminder)}
                >
                    <Trash2 className="size-4" />
                    Delete
                </Button>
            ) : (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => markReminderDone(reminder)}
                >
                    <Check className="size-4" />
                    Done
                </Button>
            )}
        </div>
    );

    return (
        <>
            <Head title="Reminders" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">
                            Reminders
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {reminders.total} application reminders
                        </p>
                    </div>

                    <form
                        onSubmit={submitSearch}
                        className="flex w-full gap-2 sm:w-80"
                    >
                        <Input
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="Search reminders"
                            className="h-9"
                        />
                        <Button type="submit" size="icon" aria-label="Search">
                            <Search className="size-4" />
                        </Button>
                    </form>
                </div>

                <div className="flex flex-wrap gap-2">
                    {[
                        ['all', 'All'],
                        ['pending', 'Pending'],
                        ['done', 'Done'],
                    ].map(([value, label]) => (
                        <Button
                            key={value}
                            type="button"
                            variant={
                                selectedStatus === value
                                    ? 'secondary'
                                    : 'outline'
                            }
                            size="sm"
                            onClick={() => changeStatusFilter(value)}
                        >
                            {label}
                        </Button>
                    ))}
                </div>

                <PreferredView
                    items={reminders.data}
                    storageKey="jobtrackr.reminders.preferred-view"
                    emptyState="No reminders found."
                    getKey={(reminder) => reminder.reminder_id}
                    columns={[
                        {
                            key: 'title',
                            label: 'Reminder',
                            render: (reminder) => (
                                <div>
                                    <div className="font-medium">
                                        {reminder.title}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {applicationTitle(reminder)}
                                    </div>
                                    {reminderNote(reminder) ? (
                                        <div className="mt-1 text-sm text-muted-foreground">
                                            {reminderNote(reminder)}
                                        </div>
                                    ) : null}
                                </div>
                            ),
                        },
                        {
                            key: 'company',
                            label: 'Company',
                            render: (reminder) => companyName(reminder),
                        },
                        {
                            key: 'status',
                            label: 'Status',
                            render: (reminder) => (
                                <Badge
                                    variant={
                                        reminder.is_completed
                                            ? 'outline'
                                            : 'secondary'
                                    }
                                >
                                    {reminder.is_completed
                                        ? 'Done'
                                        : 'Pending'}
                                </Badge>
                            ),
                        },
                        {
                            key: 'remind_at',
                            label: 'Date',
                            render: (reminder) =>
                                formatDate(reminder.remind_at),
                        },
                        {
                            key: 'actions',
                            label: 'Actions',
                            render: (reminder) => reminderActions(reminder),
                        },
                    ]}
                    renderCard={(reminder) => (
                        <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="font-medium">
                                        {reminder.title}
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        {applicationTitle(reminder)}
                                    </p>
                                </div>
                                <Badge
                                    variant={
                                        reminder.is_completed
                                            ? 'outline'
                                            : 'secondary'
                                    }
                                >
                                    {reminder.is_completed
                                        ? 'Done'
                                        : 'Pending'}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {companyName(reminder)}
                            </p>
                            {reminderNote(reminder) ? (
                                <p className="text-sm">
                                    {reminderNote(reminder)}
                                </p>
                            ) : null}
                            <p className="text-xs text-muted-foreground">
                                {formatDate(reminder.remind_at)}
                            </p>
                            {reminderActions(reminder)}
                        </div>
                    )}
                    renderListItem={(reminder) => (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-medium">
                                        {reminder.title}
                                    </span>
                                    <Badge variant="outline">
                                        {reminder.is_completed
                                            ? 'Done'
                                            : 'Pending'}
                                    </Badge>
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {applicationTitle(reminder)} ·{' '}
                                    {companyName(reminder)}
                                </p>
                                {reminderNote(reminder) ? (
                                    <p className="mt-1 text-sm">
                                        {reminderNote(reminder)}
                                    </p>
                                ) : null}
                            </div>
                            <div className="flex flex-col gap-2 sm:items-end">
                                <p className="text-xs text-muted-foreground sm:text-right">
                                    {formatDate(reminder.remind_at)}
                                </p>
                                {reminderActions(reminder)}
                            </div>
                        </div>
                    )}
                />

                {reminders.links.length > 3 ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                        <p className="text-muted-foreground">
                            Showing {reminders.from || 0} to{' '}
                            {reminders.to || 0} of {reminders.total}
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {reminders.links.map((link, index) =>
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

RemindersIndex.layout = {
    breadcrumbs: [
        {
            title: 'Reminders',
            href: '/reminders',
        },
    ],
};
