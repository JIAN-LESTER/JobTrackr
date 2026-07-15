import { Link } from '@inertiajs/react';
import { BriefcaseBusiness, History, Sparkles, User } from 'lucide-react';
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
        title: 'Analyze',
        href: '/analyze-resume',
        icon: Sparkles,
    },
    {
        title: 'Activity',
        href: '/activity',
        icon: History,
    },
];

export function AppBottomNav() {
    const { isCurrentUrl } = useCurrentUrl();
    const profileHref = edit();
    const profileActive = isCurrentUrl(profileHref);

    return (
        <nav className="fixed inset-x-0 bottom-4 z-40 px-3 pb-[env(safe-area-inset-bottom)] md:hidden">
            <div className="mx-auto grid max-w-2xl grid-cols-4 gap-1 rounded-xl border bg-card/95 p-2 shadow-lg shadow-[#17201b]/10 backdrop-blur dark:shadow-black/30">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isCurrentUrl(item.href);

                    return (
                        <Link
                            key={item.title}
                            href={item.href}
                            prefetch
                            className={cn(
                                'flex min-h-12 flex-col items-center justify-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                                active && 'bg-primary text-primary-foreground',
                            )}
                        >
                            {Icon ? <Icon className="size-5" /> : null}
                            <span className="truncate">{item.title}</span>
                        </Link>
                    );
                })}

                <Link
                    href={profileHref}
                    prefetch
                    className={cn(
                        'flex min-h-12 flex-col items-center justify-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                        profileActive && 'bg-primary text-primary-foreground',
                    )}
                >
                    <User className="size-5" />
                    <span className="truncate">Profile</span>
                </Link>
            </div>
        </nav>
    );
}
