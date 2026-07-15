import AppearanceTabs from '@/components/appearance-tabs';
import { useFlashToast } from '@/hooks/use-flash-toast';
import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';

export default function AuthLayout({
    title = '',
    description = '',
    side,
    sidePosition,
    modalOnly = false,
    children,
}: {
    title?: string;
    description?: string;
    side?: React.ReactNode;
    sidePosition?: 'left' | 'right';
    modalOnly?: boolean;
    children: React.ReactNode;
}) {
    useFlashToast();

    if (modalOnly) {
        return <>{children}</>;
    }

    return (
        <>
            <div className="fixed top-4 right-4 z-50">
                <AppearanceTabs />
            </div>

            <AuthLayoutTemplate
                title={title}
                description={description}
                side={side}
                sidePosition={sidePosition}
            >
                {children}
            </AuthLayoutTemplate>
        </>
    );
}
