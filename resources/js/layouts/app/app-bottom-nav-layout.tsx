import { AppBottomNav } from '@/components/app-bottom-nav';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { Breadcrumbs } from '@/components/breadcrumbs';
import type { AppLayoutProps } from '@/types';

export default function AppBottomNavLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <AppShell variant="header">
            <header className="border-b border-[#17201b] bg-[#17201b] px-4 py-4">
                <div className="mx-auto flex max-w-screen-2xl items-center gap-3 font-sans text-lg font-semibold text-white [&_[data-slot=breadcrumb-link]]:text-white/80 [&_[data-slot=breadcrumb-link]:hover]:text-white [&_[data-slot=breadcrumb-list]]:text-lg [&_[data-slot=breadcrumb-list]]:font-semibold [&_[data-slot=breadcrumb-page]]:font-semibold [&_[data-slot=breadcrumb-page]]:text-white [&_[data-slot=breadcrumb-separator]]:text-white/60">
                    <img
                        src="/jobtrackr-logo-white.png"
                        alt="JobTrackr"
                        className="h-7 w-auto shrink-0"
                    />
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
            </header>
            <AppContent variant="header">
                <div className="pb-24">{children}</div>
            </AppContent>
            <AppBottomNav />
        </AppShell>
    );
}
