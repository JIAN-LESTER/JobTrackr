import { Link } from '@inertiajs/react';
import { AppBottomNav } from '@/components/app-bottom-nav';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import AppLogo from '@/components/app-logo';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import { edit } from '@/routes/profile';
import type { AppLayoutProps } from '@/types';

const navItems = [
    {
        title: 'Applications',
        href: '/applications',
    },
    {
        title: 'Reminders',
        href: '/reminders',
    },
    {
        title: 'Timeline',
        href: '/status-histories',
    },
    {
        title: 'Profile',
        href: edit(),
    },
];

export default function AppBottomNavLayout({
    children,
}: AppLayoutProps) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <AppShell variant="header">
            <header className="hidden border-b bg-white px-6 md:block">
                <div className="mx-auto flex h-[74px] max-w-screen-2xl items-center gap-10">
                    <Link
                        href="/applications"
                        prefetch
                        className="flex items-center"
                    >
                        <AppLogo />
                    </Link>

                    <nav className="flex h-full items-center gap-8 text-[15px] font-medium text-[#253154]">
                        {navItems.map((item) => {
                            const active = isCurrentUrl(item.href);

                            return (
                                <Link
                                    key={item.title}
                                    href={item.href}
                                    prefetch
                                    className={cn(
                                        'relative flex h-full items-center whitespace-nowrap pt-1 hover:text-[#17201b]',
                                        active &&
                                            'font-semibold text-[#17201b] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-[#17201b]',
                                    )}
                                >
                                    {item.title}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </header>
            <AppContent variant="header">
                <div className="pb-24 md:pb-0">{children}</div>
            </AppContent>
            <AppBottomNav />
        </AppShell>
    );
}
