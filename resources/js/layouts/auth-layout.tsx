import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';

export default function AuthLayout({
    title = '',
    description = '',
    side,
    sidePosition,
    children,
}: {
    title?: string;
    description?: string;
    side?: React.ReactNode;
    sidePosition?: 'left' | 'right';
    children: React.ReactNode;
}) {
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
