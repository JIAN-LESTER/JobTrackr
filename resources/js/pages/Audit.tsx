import { Head, Link, router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import {  useState } from 'react';
import type {FormEvent} from 'react';
import { PreferredView } from '@/components/preferred-view';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Log } from '@/types/Log';

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
    created_from?: string;
    created_to?: string;
    per_page?: string;
};

type Props = {
    logs: Paginated<Log>;
    filters: Filters;
};

const formatDate = (value: string) =>
    new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));

const userName = (log: Log) => log.user?.name || 'Unknown user';

const userEmail = (log: Log) => log.user?.email || 'No email';

const cleanPageLabel = (label: string) =>
    label
        .replace('&laquo; Previous', 'Previous')
        .replace('Next &raquo;', 'Next');

export default function LogsIndex({ logs, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(
            '/logs',
            { ...filters, search: search || undefined },
            { preserveState: true, replace: true },
        );
    };

    return (
        <>
            <Head title="Audit" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">
                            Audit
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {logs.total} audit records
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
                            placeholder="Search audit"
                            className="h-9"
                        />
                        <Button type="submit" size="icon" aria-label="Search">
                            <Search className="size-4" />
                        </Button>
                    </form>
                </div>

                <PreferredView
                    items={logs.data}
                    storageKey="jobtrackr.logs.preferred-view"
                    emptyState="No logs found."
                    getKey={(log) => log.log_id}
                    columns={[
                        {
                            key: 'user',
                            label: 'User',
                            render: (log) => (
                                <div>
                                    <div className="font-medium">
                                        {userName(log)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {userEmail(log)}
                                    </div>
                                </div>
                            ),
                        },
                        {
                            key: 'action',
                            label: 'Action',
                            render: (log) => log.action,
                        },
                        {
                            key: 'created_at',
                            label: 'Date',
                            render: (log) => formatDate(log.created_at),
                        },
                    ]}
                    renderCard={(log) => (
                        <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="font-medium">
                                        {userName(log)}
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        {userEmail(log)}
                                    </p>
                                </div>
                                <Badge variant="secondary">#{log.log_id}</Badge>
                            </div>
                            <p className="text-sm">{log.action}</p>
                            <p className="text-xs text-muted-foreground">
                                {formatDate(log.created_at)}
                            </p>
                        </div>
                    )}
                    renderListItem={(log) => (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="truncate font-medium">
                                        {userName(log)}
                                    </span>
                                    <Badge variant="outline">
                                        #{log.log_id}
                                    </Badge>
                                </div>
                                <p className="mt-1 text-sm">{log.action}</p>
                            </div>
                            <p className="text-xs text-muted-foreground sm:text-right">
                                {formatDate(log.created_at)}
                            </p>
                        </div>
                    )}
                />

                {logs.links.length > 3 ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                        <p className="text-muted-foreground">
                            Showing {logs.from || 0} to {logs.to || 0} of{' '}
                            {logs.total}
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {logs.links.map((link, index) =>
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

LogsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Audit',
            href: '/logs',
        },
    ],
};
