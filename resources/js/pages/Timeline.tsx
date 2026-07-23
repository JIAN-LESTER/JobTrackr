import { Head, Link, router } from '@inertiajs/react';
import { Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { PreferredView } from '@/components/preferred-view';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ApplicationStatusHistory } from '@/types/ApplicationStatusHistory';

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
    old_status?: string;
    new_status?: string;
    per_page?: string;
};

type Props = {
    statusHistories: Paginated<ApplicationStatusHistory>;
    filters: Filters;
};

const statusLabel = (status: string | null) =>
    status
        ? status
              .split('_')
              .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
              .join(' ')
        : 'Started';

const lifecycleEvents = ['added', 'imported', 'updated', 'deleted'];

const isLifecycleEvent = (history: ApplicationStatusHistory) =>
    !history.old_status && lifecycleEvents.includes(history.new_status);

const statusBadgeClass = (status: string | null) => {
    switch (status) {
        case 'applied':
            return 'border-[#2f6f4f]/15 bg-[#dcefe4] text-[#24543d] dark:bg-[#2f6f4f]/25 dark:text-[#b8e6ca]';
        case 'saved':
            return 'border-[#8f6a1f]/15 bg-[#f8edcf] text-[#755516] dark:bg-[#f3c76a]/20 dark:text-[#f8d98a]';
        case 'interview':
        case 'final_interview':
            return 'border-[#5b4b8a]/15 bg-[#e6e1f2] text-[#4a3d75] dark:bg-[#5b4b8a]/30 dark:text-[#d8cff5]';
        case 'offer':
        case 'hired':
            return 'border-[#7a5b1c]/15 bg-[#f6e6b8] text-[#654914] dark:bg-[#f3c76a]/25 dark:text-[#ffe7a3]';
        case 'rejected':
        case 'ghosted':
        case 'offer_declined':
            return 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300';
        case 'closed':
            return 'border-[#59675e]/20 bg-[#e2e8e3] text-[#435047] dark:border-[#526157]/40 dark:bg-[#27362d] dark:text-[#cbd8cf]';
        case 'offered_another_position':
            return 'border-[#2f6d7c]/15 bg-[#d9edf1] text-[#245867] dark:bg-[#2f6d7c]/25 dark:text-[#b5e2eb]';
        case 'added':
        case 'imported':
            return 'border-[#2f6f4f]/15 bg-[#dcefe4] text-[#24543d] dark:bg-[#2f6f4f]/25 dark:text-[#b8e6ca]';
        case 'updated':
            return 'border-[#2f6d7c]/15 bg-[#d9edf1] text-[#245867] dark:bg-[#2f6d7c]/25 dark:text-[#b5e2eb]';
        case 'deleted':
            return 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300';
        default:
            return 'border-[#cbd8cf] bg-[#eef3ef] text-[#324338] dark:border-[#33463a] dark:bg-[#213128] dark:text-[#d8e2da]';
    }
};

const TimelineChange = ({ history }: { history: ApplicationStatusHistory }) =>
    isLifecycleEvent(history) ? (
        <div className="flex flex-wrap items-center gap-2">
            <Badge
                variant="outline"
                className={statusBadgeClass(history.new_status)}
            >
                {statusLabel(history.new_status)}
            </Badge>
            {history.remarks ? (
                <span className="text-sm text-muted-foreground">
                    {history.remarks}
                </span>
            ) : null}
        </div>
    ) : (
        <div className="flex flex-wrap items-center gap-2">
            <Badge
                variant="outline"
                className={statusBadgeClass(history.old_status)}
            >
                {statusLabel(history.old_status)}
            </Badge>
            <span className="text-xs text-muted-foreground">to</span>
            <Badge
                variant="outline"
                className={statusBadgeClass(history.new_status)}
            >
                {statusLabel(history.new_status)}
            </Badge>
        </div>
    );

const formatDate = (value: string) =>
    new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));

const applicationTitle = (history: ApplicationStatusHistory) =>
    history.job_application?.job_title || 'No application';

const companyName = (history: ApplicationStatusHistory) =>
    history.job_application?.company?.name || 'Unknown company';

const cleanPageLabel = (label: string) =>
    label
        .replace('&laquo; Previous', 'Previous')
        .replace('Next &raquo;', 'Next');

export default function StatusHistoriesIndex({
    statusHistories,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(
            '/status-histories',
            { ...filters, search: search || undefined },
            { preserveState: true, replace: true },
        );
    };

    const deleteTimelineItem = (history: ApplicationStatusHistory) => {
        router.delete(`/status-histories/${history.id}`, {
            preserveScroll: true,
        });
    };

    const clearTimeline = () => {
        if (!window.confirm('Clear all timeline updates?')) {
            return;
        }

        router.delete('/status-histories', {
            preserveScroll: true,
        });
    };

    const timelineActions = (history: ApplicationStatusHistory) => (
        <div className="flex flex-wrap items-center gap-2">
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-red-100 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
                onClick={() => deleteTimelineItem(history)}
            >
                <Trash2 className="size-4" />
                Delete
            </Button>
        </div>
    );

    return (
        <>
            <Head title="Timeline" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto bg-[#eef3ef] p-4 dark:bg-background">
                <div className="rounded-lg border border-[#cbd8cf] bg-[#f8faf7] p-4 shadow-sm shadow-[#17201b]/5 dark:border-[#33463a] dark:bg-[#16231c]">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight">
                                Timeline
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {statusHistories.total} application updates
                            </p>
                        </div>

                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="border-red-100 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
                                disabled={statusHistories.total === 0}
                                onClick={clearTimeline}
                            >
                                <Trash2 className="size-4" />
                                Clear all
                            </Button>
                            <form
                                onSubmit={submitSearch}
                                className="flex w-full gap-2 sm:w-80"
                            >
                                <Input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search timeline"
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
                        </div>
                    </div>
                </div>

                <PreferredView
                    items={statusHistories.data}
                    storageKey="jobtrackr.timeline.preferred-view"
                    emptyState="No timeline updates found."
                    getKey={(history) => history.id}
                    columns={[
                        {
                            key: 'application',
                            label: 'Application',
                            render: (history) => (
                                <div>
                                    <div className="font-medium">
                                        {applicationTitle(history)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {companyName(history)}
                                    </div>
                                </div>
                            ),
                        },
                        {
                            key: 'status',
                            label: 'Update',
                            render: (history) => (
                                <TimelineChange history={history} />
                            ),
                        },
                        {
                            key: 'created_at',
                            label: 'Date',
                            render: (history) => formatDate(history.created_at),
                        },
                        {
                            key: 'actions',
                            label: 'Actions',
                            render: (history) => timelineActions(history),
                        },
                    ]}
                    renderCard={(history) => (
                        <div className="space-y-3">
                            <div>
                                <h2 className="font-medium">
                                    {applicationTitle(history)}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {companyName(history)}
                                </p>
                            </div>
                            <TimelineChange history={history} />
                            {history.remarks && !isLifecycleEvent(history) ? (
                                <p className="text-sm">{history.remarks}</p>
                            ) : null}
                            <p className="text-xs text-muted-foreground">
                                {formatDate(history.created_at)}
                            </p>
                            {timelineActions(history)}
                        </div>
                    )}
                    renderListItem={(history) => (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <div className="font-medium">
                                    {applicationTitle(history)}
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {companyName(history)}
                                </p>
                                <div className="mt-2">
                                    <TimelineChange history={history} />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 sm:items-end">
                                <p className="text-xs text-muted-foreground sm:text-right">
                                    {formatDate(history.created_at)}
                                </p>
                                {timelineActions(history)}
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

                {statusHistories.links.length > 3 ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                        <p className="text-muted-foreground">
                            Showing {statusHistories.from || 0} to{' '}
                            {statusHistories.to || 0} of {statusHistories.total}
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {statusHistories.links.map((link, index) =>
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

StatusHistoriesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Timeline',
            href: '/status-histories',
        },
    ],
};
