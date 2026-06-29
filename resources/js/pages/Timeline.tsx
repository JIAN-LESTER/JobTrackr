import { Head, Link, router } from '@inertiajs/react';
import { Search } from 'lucide-react';
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

const TimelineChange = ({ history }: { history: ApplicationStatusHistory }) =>
    isLifecycleEvent(history) ? (
        <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{statusLabel(history.new_status)}</Badge>
            {history.remarks ? (
                <span className="text-sm text-muted-foreground">
                    {history.remarks}
                </span>
            ) : null}
        </div>
    ) : (
        <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{statusLabel(history.old_status)}</Badge>
            <span className="text-xs text-muted-foreground">to</span>
            <Badge variant="secondary">{statusLabel(history.new_status)}</Badge>
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

    return (
        <>
            <Head title="Timeline" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">
                            Timeline
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {statusHistories.total} application updates
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
                            placeholder="Search timeline"
                            className="h-9"
                        />
                        <Button type="submit" size="icon" aria-label="Search">
                            <Search className="size-4" />
                        </Button>
                    </form>
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
                            render: (history) => <TimelineChange history={history} />,
                        },
                        {
                            key: 'created_at',
                            label: 'Date',
                            render: (history) => formatDate(history.created_at),
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
                            <p className="text-xs text-muted-foreground sm:text-right">
                                {formatDate(history.created_at)}
                            </p>
                        </div>
                    )}
                />

                {statusHistories.links.length > 3 ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                        <p className="text-muted-foreground">
                            Showing {statusHistories.from || 0} to{' '}
                            {statusHistories.to || 0} of{' '}
                            {statusHistories.total}
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
