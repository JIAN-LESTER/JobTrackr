import { Link, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import { AppBottomNav } from '@/components/app-bottom-nav';
import { AppContent } from '@/components/app-content';
import AppLogo from '@/components/app-logo';
import { AppShell } from '@/components/app-shell';
import AppearanceTabs from '@/components/appearance-tabs';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import type { AppLayoutProps } from '@/types';
import { edit } from '@/routes/profile';

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

export default function AppBottomNavLayout({ children }: AppLayoutProps) {
    const { auth } = usePage().props;
    const { currentUrl, isCurrentUrl } = useCurrentUrl();
    const onboardingIncomplete = !auth.user.onboarding_completed_at;
    const isOnboarding = currentUrl === '/onboarding';
    const shouldHideBottomNav = isOnboarding;

    return (
        <AppShell variant="header">
            <header className="hidden border-b border-[#cbd8cf] bg-white px-6 md:block dark:border-[#33463a] dark:bg-[#16231c]">
                <div className="mx-auto flex h-[74px] max-w-screen-2xl items-center gap-10">
                    <Link
                        href="/applications"
                        prefetch
                        className="flex items-center"
                    >
                        <AppLogo />
                    </Link>

                    <nav className="flex h-full items-center gap-8 text-[15px] font-medium text-[#253154] dark:text-[#afbeb4]">
                        {navItems.map((item) => {
                            const active = isCurrentUrl(item.href);
                            const disabledForOnboarding =
                                onboardingIncomplete && item.title !== 'Profile';

                            return (
                                <Link
                                    key={item.title}
                                    href={item.href}
                                    prefetch={!disabledForOnboarding}
                                    onClick={(event) => {
                                        if (!disabledForOnboarding) {
                                            return;
                                        }

                                        event.preventDefault();
                                        toast.info(
                                            'Complete onboarding first.',
                                        );
                                    }}
                                    className={cn(
                                        'relative flex h-full items-center pt-1 whitespace-nowrap hover:text-[#17201b] dark:hover:text-[#f4f8f2]',
                                        disabledForOnboarding &&
                                            'cursor-not-allowed opacity-60',
                                        active &&
                                            'font-semibold text-[#17201b] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-[#17201b] dark:text-[#f4f8f2] dark:after:bg-[#f3c76a]',
                                    )}
                                >
                                    {item.title}
                                </Link>
                            );
                        })}
                    </nav>

                    <AppearanceTabs className="ml-auto" />
                </div>
            </header>
            <AppContent variant="header">
                <div className={cn(!shouldHideBottomNav && 'pb-24 md:pb-0')}>
                    {children}
                </div>
            </AppContent>
            {!shouldHideBottomNav && <AppBottomNav />}
        </AppShell>
    );
}
