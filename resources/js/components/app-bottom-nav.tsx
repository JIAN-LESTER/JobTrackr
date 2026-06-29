import { Link, usePage } from '@inertiajs/react';
import { Bell, BriefcaseBusiness, History, User } from 'lucide-react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import { edit } from '@/routes/profile';
import type { NavItem } from '@/types';

const navItems: NavItem[] = [
    {
        title: 'Applications',
        href: '/applications',
        icon: BriefcaseBusiness,
    },
    {
        title: 'Reminders',
        href: '/reminders',
        icon: Bell,
    },
    {
        title: 'Timeline',
        href: '/status-histories',
        icon: History,
    },
];

export function AppBottomNav() {
    const { auth } = usePage().props;
    const { isCurrentUrl } = useCurrentUrl();
    const user = auth?.user;
    const profileHref = user ? edit() : '/login';
    const profileActive = user ? isCurrentUrl(edit()) : isCurrentUrl('/login');

    return (
        <nav className="fixed inset-x-0 bottom-4 z-40 px-3 pb-[env(safe-area-inset-bottom)]">
            <div className="mx-auto grid max-w-2xl grid-cols-4 gap-1 rounded-xl border bg-background/95 p-2 shadow-lg backdrop-blur">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isCurrentUrl(item.href);

                    return (
                        <Link
                            key={item.title}
                            href={item.href}
                            prefetch
                            className={cn(
                                'flex min-h-12 flex-col items-center justify-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground',
                                active &&
                                    'bg-secondary text-secondary-foreground',
                            )}
                        >
                            {Icon ? <Icon className="size-5" /> : null}
                            <span className="truncate">{item.title}</span>
                        </Link>
                    );
                })}

                <Link
                    href={profileHref}
                    prefetch={Boolean(user)}
                    className={cn(
                        'flex min-h-12 flex-col items-center justify-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground',
                        profileActive && 'bg-secondary text-secondary-foreground',
                    )}
                >
                    <User className="size-5" />
                    <span className="truncate">Profile</span>
                </Link>
            </div>
        </nav>
    );
}
