import { Head, Link, router, useForm } from '@inertiajs/react';
import { Check, ExternalLink, Search } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type ImportData = {
    extracted?: boolean;
    url?: string;
    company?: string;
    job_title?: string;
    location?: string | null;
    job_type?: string | null;
    work_setup?: string | null;
    salary_min?: string | number | null;
    salary_max?: string | number | null;
    job_description?: string | null;
};

type Props = {
    importData: ImportData;
};

const importedPlaceholders = ['Imported', 'Imported job'];

const importedValue = (value: string | undefined, fallback: string) =>
    value && !importedPlaceholders.includes(value) ? value : fallback;

const escapeRegExp = (value: string) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const websiteLabel = (url: string | undefined) => {
    if (!url) {
        return 'Website';
    }

    try {
        return new URL(url).hostname.replace(/^www\./, '') || 'Website';
    } catch {
        return 'Website';
    }
};

const importUrlFromText = (value: string) => {
    const url = value.trim().match(/https?:\/\/[^\s]+/i)?.[0] || value.trim();

    try {
        return new URL(url).toString();
    } catch {
        return null;
    }
};

const isSiteLabel = (label: string, website: string) =>
    ['linkedin', 'linkedin.com', website.toLowerCase()].includes(
        label.toLowerCase(),
    );

const cleanApplicationImport = (
    title: string,
    company: string,
    website: string,
) => {
    const parts = title
        .split('|')
        .map((part) => part.trim())
        .filter(Boolean);

    while (
        parts.length > 1 &&
        isSiteLabel(parts[parts.length - 1] || '', website)
    ) {
        parts.pop();
    }

    let cleanCompany = company;

    if (
        parts.length > 1 &&
        (isSiteLabel(cleanCompany, website) || cleanCompany === 'Website')
    ) {
        cleanCompany = parts.pop() || cleanCompany;
    }

    let cleanTitle = parts.join(' | ') || title;

    [cleanCompany, website]
        .filter((label) => label && !isSiteLabel(label, website))
        .forEach((label) => {
            cleanTitle = cleanTitle
                .replace(
                    new RegExp(
                        `\\s*(?:\\||-| at )\\s*${escapeRegExp(label)}\\s*$`,
                        'i',
                    ),
                    '',
                )
                .trim();
        });

    return {
        company: cleanCompany,
        title: cleanTitle || 'Application',
    };
};

type ApplicationImportForm = {
    import_url_only: boolean;
    from_import: boolean;
    company: string;
    company_industry: string;
    job_title: string;
    job_type: string;
    work_setup: string;
    location: string;
    salary_min: string;
    salary_max: string;
    status: string;
    applied_date: string;
    job_post_url: string;
    job_description: string;
};

export default function ApplicationImport({ importData }: Props) {
    const [extracting, setExtracting] = useState(false);
    const extensionInstallUrl =
        import.meta.env.VITE_BROWSER_EXTENSION_URL?.trim();
    const importedWebsite = websiteLabel(importData.url);
    const importedCompany = importedValue(importData.company, importedWebsite);
    const importedApplication = cleanApplicationImport(
        importedValue(importData.job_title, 'Application'),
        importedCompany,
        importedWebsite,
    );
    const form = useForm<ApplicationImportForm>({
        import_url_only: !importData.extracted,
        from_import: true,
        company: importedApplication.company,
        company_industry: '',
        job_title: importedApplication.title,
        job_type: importData.job_type || '',
        work_setup: importData.work_setup || '',
        location: importData.location || '',
        salary_min:
            importData.salary_min === null ||
            importData.salary_min === undefined
                ? ''
                : String(importData.salary_min),
        salary_max:
            importData.salary_max === null ||
            importData.salary_max === undefined
                ? ''
                : String(importData.salary_max),
        status: 'applied',
        applied_date: new Date().toISOString().slice(0, 10),
        job_post_url: importData.url || '',
        job_description: importData.job_description || '',
    });

    const submitApplication = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.post('/applications', {
            onSuccess: () => {
                form.reset();
            },
        });
    };

    const extractFromUrl = (value: string) => {
        const url = importUrlFromText(value);

        if (!url) {
            return;
        }

        setExtracting(true);
        router.get(
            '/applications/import',
            { url },
            {
                preserveScroll: true,
                replace: true,
                onFinish: () => setExtracting(false),
            },
        );
    };

    return (
        <>
            <Head title="Job Import" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto bg-[#eef3ef] p-4 dark:bg-background">
                <div className="rounded-lg border border-[#cbd8cf] bg-[#f8faf7] p-4 shadow-sm shadow-[#17201b]/5 dark:border-[#33463a] dark:bg-[#16231c]">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight">
                                Job import
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Save a job post URL from LinkedIn, Indeed, and
                                other job boards.
                            </p>
                        </div>
                        <Button
                            asChild
                            variant="outline"
                            className="border-[#cbd8cf] bg-white/70 dark:border-[#33463a] dark:bg-[#213128]/70"
                        >
                            <Link href="/applications">Applications</Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
                    <form
                        onSubmit={submitApplication}
                        className="space-y-4 rounded-lg border border-[#cbd8cf] bg-[#f8faf7] p-4 shadow-sm shadow-[#17201b]/5 dark:border-[#33463a] dark:bg-[#16231c]"
                    >
                        <div className="space-y-2">
                            <Label htmlFor="job_post_url">Job post URL</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="job_post_url"
                                    type="url"
                                    value={form.data.job_post_url}
                                    className="bg-white/80 dark:bg-[#0f1713]/40"
                                    onChange={(event) =>
                                        form.setData(
                                            'job_post_url',
                                            event.target.value,
                                        )
                                    }
                                    onPaste={(event) => {
                                        const url = importUrlFromText(
                                            event.clipboardData.getData('text'),
                                        );

                                        if (url) {
                                            event.preventDefault();
                                            form.setData('job_post_url', url);
                                            extractFromUrl(url);
                                        }
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={
                                        extracting || !form.data.job_post_url
                                    }
                                    className="shrink-0 border-[#cbd8cf] bg-white/70 dark:border-[#33463a] dark:bg-[#213128]/70"
                                    onClick={() =>
                                        extractFromUrl(form.data.job_post_url)
                                    }
                                >
                                    {extracting ? <Spinner /> : <Search />}
                                    Extract
                                </Button>
                            </div>
                            {importData.extracted ? (
                                <p className="text-sm text-muted-foreground">
                                    Extracted job details from the URL.
                                </p>
                            ) : null}
                            {form.errors.job_post_url ? (
                                <p className="text-sm text-destructive">
                                    {form.errors.job_post_url}
                                </p>
                            ) : null}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="company">Company name</Label>
                                <Input
                                    id="company"
                                    value={form.data.company}
                                    className="bg-white/80 dark:bg-[#0f1713]/40"
                                    onChange={(event) =>
                                        form.setData(
                                            'company',
                                            event.target.value,
                                        )
                                    }
                                />
                                {form.errors.company ? (
                                    <p className="text-sm text-destructive">
                                        {form.errors.company}
                                    </p>
                                ) : null}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="job_title">
                                    Job position role
                                </Label>
                                <Input
                                    id="job_title"
                                    value={form.data.job_title}
                                    className="bg-white/80 dark:bg-[#0f1713]/40"
                                    onChange={(event) =>
                                        form.setData(
                                            'job_title',
                                            event.target.value,
                                        )
                                    }
                                />
                                {form.errors.job_title ? (
                                    <p className="text-sm text-destructive">
                                        {form.errors.job_title}
                                    </p>
                                ) : null}
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    value={form.data.location}
                                    className="bg-white/80 dark:bg-[#0f1713]/40"
                                    onChange={(event) =>
                                        form.setData(
                                            'location',
                                            event.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="job_type">Job type</Label>
                                <Input
                                    id="job_type"
                                    value={form.data.job_type}
                                    className="bg-white/80 dark:bg-[#0f1713]/40"
                                    onChange={(event) =>
                                        form.setData(
                                            'job_type',
                                            event.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="work_setup">Work setup</Label>
                                <Input
                                    id="work_setup"
                                    value={form.data.work_setup}
                                    className="bg-white/80 dark:bg-[#0f1713]/40"
                                    onChange={(event) =>
                                        form.setData(
                                            'work_setup',
                                            event.target.value,
                                        )
                                    }
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="job_description">
                                Job description
                            </Label>
                            <textarea
                                id="job_description"
                                value={form.data.job_description}
                                rows={10}
                                className="flex w-full rounded-md border border-input bg-white/80 px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-[#0f1713]/40"
                                onChange={(event) =>
                                    form.setData(
                                        'job_description',
                                        event.target.value,
                                    )
                                }
                            />
                        </div>

                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={form.processing}
                                className="bg-[#17201b] text-[#f4f8f2] hover:bg-[#2d3b31] dark:bg-[#f3c76a] dark:text-[#17201b] dark:hover:bg-[#e0b657]"
                            >
                                {form.processing ? <Spinner /> : <Check />}
                                Save application
                            </Button>
                        </div>
                    </form>

                    <div className="space-y-4 rounded-lg border border-[#cbd8cf] bg-[#f8faf7] p-4 shadow-sm shadow-[#17201b]/5 dark:border-[#33463a] dark:bg-[#16231c]">
                        <div className="space-y-2">
                            <h2 className="font-medium">Download extension</h2>
                            <p className="text-sm text-muted-foreground">
                                Install the JobTrackr browser extension to send
                                job post URLs from supported job boards into
                                this import screen.
                            </p>
                        </div>
                        <div className="space-y-2 rounded-md border border-[#cbd8cf] bg-[#eef3ef] p-3 text-sm text-muted-foreground dark:border-[#33463a] dark:bg-[#213128]">
                            <p>
                                Use it while viewing a job listing to open
                                JobTrackr with the posting URL ready to review
                                and save.
                            </p>
                            <p>
                                Works best with Google Chrome and compatible
                                Chromium browsers.
                            </p>
                        </div>
                        {extensionInstallUrl ? (
                            <Button
                                asChild
                                className="w-full bg-[#17201b] text-[#f4f8f2] hover:bg-[#2d3b31] dark:bg-[#f3c76a] dark:text-[#17201b] dark:hover:bg-[#e0b657]"
                            >
                                <a
                                    href={extensionInstallUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <ExternalLink />
                                    Download JobTrackr extension
                                </a>
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                className="w-full bg-[#17201b] text-[#f4f8f2] dark:bg-[#f3c76a] dark:text-[#17201b]"
                                disabled
                            >
                                <ExternalLink />
                                Extension download unavailable
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

ApplicationImport.layout = {
    breadcrumbs: [
        {
            title: 'Job import',
            href: '/applications/import',
        },
    ],
};
