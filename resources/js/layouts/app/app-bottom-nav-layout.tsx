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
            <header className="border-b px-4 py-4">
                <div className="mx-auto max-w-7xl">
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
