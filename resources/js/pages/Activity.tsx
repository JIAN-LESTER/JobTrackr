import { Head, router } from '@inertiajs/react';
import { Bell, Check, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ApplicationStatusHistory } from '@/types/ApplicationStatusHistory';
import type { Reminder } from '@/types/Reminder';

type Props = {
    statusHistories: ApplicationStatusHistory[];
    reminders: Reminder[];
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
                                    Latest application changes
                                </p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {statusHistories.length ? (
                                statusHistories.map((item) => (
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
                                            <Badge variant="outline">
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
