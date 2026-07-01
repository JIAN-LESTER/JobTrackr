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
    if (modalOnly) {
        return <>{children}</>;
    }

    return (
        <AuthLayoutTemplate
            title={title}
            description={description}
            side={side}
            sidePosition={sidePosition}
        >
            {children}
        </AuthLayoutTemplate>
    );
}
