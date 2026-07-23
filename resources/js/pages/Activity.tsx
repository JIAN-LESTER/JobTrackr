import { Head, Link, router } from '@inertiajs/react';
import { Bell, Check, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ApplicationStatusHistory } from '@/types/ApplicationStatusHistory';
import type { Reminder } from '@/types/Reminder';

type Props = {
    statusHistories: Paginated<ApplicationStatusHistory>;
    reminders: Reminder[];
};

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

const formatDate = (value: string) =>
    new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));

const label = (value: string | null) =>
    value
        ? value
              .split('_')
              .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
              .join(' ')
        : 'Started';

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
        default:
            return 'border-[#cbd8cf] bg-[#eef3ef] text-[#324338] dark:border-[#33463a] dark:bg-[#213128] dark:text-[#d8e2da]';
    }
};

const cleanPageLabel = (label: string) =>
    label
        .replace('&laquo; Previous', 'Previous')
        .replace('Next &raquo;', 'Next');

export default function Activity({ statusHistories, reminders }: Props) {
    return (
        <>
            <Head title="Activity" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto bg-[#eef3ef] p-4 dark:bg-background">
                <div className="rounded-lg border border-[#cbd8cf] bg-[#f8faf7] p-4 shadow-sm dark:border-[#33463a] dark:bg-[#16231c]">
                    <h1 className="text-xl font-semibold tracking-tight">
                        Activity
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        See your application activity and upcoming reminders.
                    </p>
                </div>
                <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
                    <section className="rounded-lg border border-[#cbd8cf] bg-[#f8faf7] p-4 shadow-sm dark:border-[#33463a] dark:bg-[#16231c]">
                        <div className="mb-4 flex items-center gap-2">
                            <History className="size-5 text-[#2f6f4f]" />
                            <div>
                                <h2 className="font-semibold">Timeline</h2>
                                <p className="text-sm text-muted-foreground">
                                    {statusHistories.total} application changes
                                </p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {statusHistories.data.length ? (
                                statusHistories.data.map((item) => (
                                    <div
                                        key={item.id}
                                        className="border-l-2 border-[#9bc8aa] pl-3"
                                    >
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-medium">
                                                {item.job_application
                                                    ?.job_title ||
                                                    'Application'}
                                            </p>
                                            <Badge
                                                variant="outline"
                                                className={statusBadgeClass(
                                                    item.new_status,
                                                )}
                                            >
                                                {label(item.new_status)}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {item.job_application?.company
                                                ?.name ||
                                                'Unknown company'}{' '}
                                            ·{' '}
                                            {item.remarks ||
                                                (item.old_status
                                                    ? `${label(item.old_status)} to ${label(item.new_status)}`
                                                    : 'Application update')}
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {formatDate(item.created_at)}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="py-8 text-sm text-muted-foreground">
                                    No application activity yet.
                                </p>
                            )}
                        </div>
                        {statusHistories.links.length > 3 ? (
                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#d9e2db] pt-4 text-sm dark:border-[#33463a]">
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
                                                    link.active
                                                        ? 'secondary'
                                                        : 'outline'
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
                                                variant="outline"
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
                    </section>
                    <aside className="rounded-lg border border-[#cbd8cf] bg-[#f8faf7] p-4 shadow-sm dark:border-[#33463a] dark:bg-[#16231c]">
                        <div className="mb-4 flex items-center gap-2">
                            <Bell className="size-5 text-[#8f6a1f]" />
                            <div>
                                <h2 className="font-semibold">
                                    Upcoming reminders
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {reminders.length} pending
                                </p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {reminders.length ? (
                                reminders.map((reminder) => (
                                    <div
                                        key={reminder.reminder_id}
                                        className="rounded-md border border-[#d9e2db] p-3 dark:border-[#33463a]"
                                    >
                                        <p className="font-medium">
                                            {reminder.title}
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {
                                                reminder.job_application
                                                    ?.job_title
                                            }{' '}
                                            · {formatDate(reminder.remind_at)}
                                        </p>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="mt-3"
                                            onClick={() =>
                                                router.delete(
                                                    `/reminders/${reminder.reminder_id}`,
                                                    { preserveScroll: true },
                                                )
                                            }
                                        >
                                            <Check className="size-4" />
                                            Mark done
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <p className="py-8 text-sm text-muted-foreground">
                                    No upcoming reminders.
                                </p>
                            )}
                        </div>
                    </aside>
                </div>
            </div>
        </>
    );
}

Activity.layout = { breadcrumbs: [{ title: 'Activity', href: '/activity' }] };
