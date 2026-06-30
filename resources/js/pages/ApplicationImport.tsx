import { Head, Link, useForm } from '@inertiajs/react';
import { Bookmark, Check, Copy, ExternalLink } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
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
                .replace(new RegExp(`\\s*(?:\\||-| at )\\s*${escapeRegExp(label)}\\s*$`, 'i'), '')
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
    const [copied, setCopied] = useState(false);
    const extensionInstallUrl = import.meta.env.VITE_BROWSER_EXTENSION_URL?.trim();
    const importedWebsite = websiteLabel(importData.url);
    const importedCompany = importedValue(importData.company, importedWebsite);
    const importedApplication = cleanApplicationImport(
        importedValue(importData.job_title, 'Application'),
        importedCompany,
        importedWebsite,
    );
    const bookmarklet = useMemo(() => {
        const target = `${window.location.origin}/applications/import`;
        const script = `javascript:(()=>{const q=new URLSearchParams({url:location.href});location.href='${target}?'+q.toString();})();`;

        return script;
    }, []);
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
            importData.salary_min === null || importData.salary_min === undefined
                ? ''
                : String(importData.salary_min),
        salary_max:
            importData.salary_max === null || importData.salary_max === undefined
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

    const copyBookmarklet = async () => {
        await navigator.clipboard.writeText(bookmarklet);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
    };

    return (
        <>
            <Head title="Job Import" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">
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
                    <Button asChild variant="outline">
                        <Link href="/applications">Applications</Link>
                    </Button>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
                    <form
                        onSubmit={submitApplication}
                        className="space-y-4 rounded-md border p-4"
                    >
                        <div className="space-y-2">
                            <Label htmlFor="job_post_url">Job post URL</Label>
                            <Input
                                id="job_post_url"
                                type="url"
                                value={form.data.job_post_url}
                                onChange={(event) =>
                                    form.setData(
                                        'job_post_url',
                                        event.target.value,
                                    )
                                }
                            />
                            {form.errors.job_post_url ? (
                                <p className="text-sm text-destructive">
                                    {form.errors.job_post_url}
                                </p>
                            ) : null}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    value={form.data.location}
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
                                    onChange={(event) =>
                                        form.setData(
                                            'work_setup',
                                            event.target.value,
                                        )
                                    }
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={form.processing}>
                                {form.processing ? <Spinner /> : <Check />}
                                Save application
                            </Button>
                        </div>
                    </form>

                    <div className="space-y-4 rounded-md border p-4">
                        <div className="space-y-2">
                            <h2 className="font-medium">Bookmarklet</h2>
                            <p className="text-sm text-muted-foreground">
                                Drag or copy this to your bookmarks bar.
                            </p>
                        </div>
                        <Button asChild className="w-full">
                            <a href={bookmarklet}>
                                <Bookmark />
                                Save to JobTrackr
                            </a>
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={copyBookmarklet}
                        >
                            <Copy />
                            {copied ? 'Copied' : 'Copy bookmarklet'}
                        </Button>
                        {extensionInstallUrl && (
                            <div className="space-y-2 border-t pt-4">
                                <h2 className="font-medium">
                                    Google Chrome extension
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Download the JobTrackr extension for Google
                                    Chrome.
                                </p>
                                <Button
                                    asChild
                                    variant="outline"
                                    className="w-full"
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
                            </div>
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
