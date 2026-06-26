import { Head } from '@inertiajs/react';
import { PreferredView } from '@/components/preferred-view';
import { Badge } from '@/components/ui/badge';
import type { Company } from '@/types/Company';

type CompanyWithCount = Company & {
    applications_count: number;
};

type Props = {
    companies: CompanyWithCount[];
};

export default function Companies({ companies }: Props) {
    return (
        <>
            <Head title="Companies" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">
                        Companies
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {companies.length} companies from your applications
                    </p>
                </div>

                <PreferredView
                    items={companies}
                    storageKey="jobtrackr.companies.preferred-view"
                    emptyState="No companies found."
                    getKey={(company) => company.company_id}
                    columns={[
                        {
                            key: 'name',
                            label: 'Company',
                            render: (company) => company.name,
                        },
                        {
                            key: 'applications',
                            label: 'Applications',
                            render: (company) => company.applications_count,
                        },
                        {
                            key: 'latest',
                            label: 'Latest role',
                            render: (company) =>
                                company.applications?.[0]?.job_title || 'None',
                        },
                    ]}
                    renderCard={(company) => (
                        <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="font-medium">
                                        {company.name}
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        {company.applications?.[0]?.job_title ||
                                            'No role'}
                                    </p>
                                </div>
                                <Badge variant="secondary">
                                    {company.applications_count}
                                </Badge>
                            </div>
                        </div>
                    )}
                    renderListItem={(company) => (
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="font-medium">{company.name}</h2>
                                <p className="text-sm text-muted-foreground">
                                    {company.applications?.[0]?.job_title ||
                                        'No role'}
                                </p>
                            </div>
                            <Badge variant="outline">
                                {company.applications_count}
                            </Badge>
                        </div>
                    )}
                />
            </div>
        </>
    );
}

Companies.layout = {
    breadcrumbs: [
        {
            title: 'Companies',
            href: '/companies',
        },
    ],
};
