import { Head, Link } from '@inertiajs/react';
import { BriefcaseBusiness, Building2, ScrollText } from 'lucide-react';
import { dashboard } from '@/routes';

export default function Dashboard() {
    const sections = [
        {
            title: 'Application',
            href: '/applications',
            icon: BriefcaseBusiness,
        },
        {
            title: 'Company',
            href: '/companies',
            icon: Building2,
        },
        {
            title: 'Audit',
            href: '/logs',
            icon: ScrollText,
        },
    ];

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">
                        Dashboard
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Job tracking workspace
                    </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                    {sections.map((section) => (
                        <Link
                            key={section.title}
                            href={section.href}
                            className="flex items-center gap-3 rounded-lg border p-4 text-sm font-medium transition-colors hover:bg-muted"
                        >
                            <section.icon className="size-5" />
                            <span>{section.title}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
