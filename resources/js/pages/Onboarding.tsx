import { Head, useForm } from '@inertiajs/react';
import { BriefcaseBusiness, Camera, GraduationCap } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import AvatarPresetPicker from '@/components/avatar-preset-picker';
import DegreeSelect from '@/components/degree-select';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import LocationSelect from '@/components/location-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import type { Auth } from '@/types';

type Props = {
    user: Auth['user'];
};

type OnboardingForm = {
    first_name: string;
    last_name: string;
    industry: string;
    job_title: string;
    location: string;
    education_school: string;
    education_degree: string;
    education_program: string;
    avatar_preset: string;
    photo: File | null;
};

type OnboardingValidationErrors = Partial<Record<keyof OnboardingForm, string>>;

type OnboardingStep = {
    label: string;
    icon: typeof BriefcaseBusiness;
};

type OnboardingDraftField = keyof Omit<OnboardingForm, 'photo'>;

type OnboardingDraftData = Partial<Record<OnboardingDraftField, string>>;

type OnboardingDraft = {
    data: OnboardingDraftData;
    step: number;
};

const maxPhotoSize = 2048 * 1024;

const industries = [
    'Accounting',
    'Advertising',
    'Business Process Outsourcing',
    'Construction',
    'Education',
    'Finance',
    'Healthcare',
    'Hospitality',
    'Information Technology',
    'Manufacturing',
    'Retail',
    'Telecommunications',
    'Transportation',
];

const onboardingSteps: OnboardingStep[] = [
    {
        label: 'Career',
        icon: BriefcaseBusiness,
    },
    {
        label: 'Education',
        icon: GraduationCap,
    },
    {
        label: 'Picture',
        icon: Camera,
    },
];

const onboardingDraftKey = (userId: number | string) =>
    `jobtrackr:onboarding-draft:${userId}`;

const onboardingDraftFields = [
    'first_name',
    'last_name',
    'industry',
    'job_title',
    'location',
    'education_school',
    'education_degree',
    'education_program',
    'avatar_preset',
] as const satisfies readonly OnboardingDraftField[];

const requiredMessage = (label: string) => `${label} is required.`;

const normalizeStep = (value: unknown) =>
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0 &&
    value < onboardingSteps.length
        ? value
        : 0;

const readOnboardingDraft = (draftKey: string): OnboardingDraft | null => {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const storedDraft = window.sessionStorage.getItem(draftKey);

        if (!storedDraft) {
            return null;
        }

        const parsedDraft = JSON.parse(storedDraft) as {
            data?: Record<string, unknown>;
            step?: unknown;
        };
        const data = onboardingDraftFields.reduce<OnboardingDraftData>(
            (draftData, field) => {
                const value = parsedDraft.data?.[field];

                if (typeof value === 'string') {
                    draftData[field] = value;
                }

                return draftData;
            },
            {},
        );

        return {
            data,
            step: normalizeStep(parsedDraft.step),
        };
    } catch {
        return null;
    }
};

const writeOnboardingDraft = (
    draftKey: string,
    data: OnboardingForm,
    step: number,
) => {
    if (typeof window === 'undefined') {
        return;
    }

    const draftData = onboardingDraftFields.reduce<OnboardingDraftData>(
        (persistedData, field) => {
            persistedData[field] = data[field];

            return persistedData;
        },
        {},
    );

    try {
        window.sessionStorage.setItem(
            draftKey,
            JSON.stringify({
                data: draftData,
                step,
            }),
        );
    } catch {
        // Browsers may block session storage in private or restricted modes.
    }
};

const clearOnboardingDraft = (draftKey: string) => {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.sessionStorage.removeItem(draftKey);
    } catch {
        // Browsers may block session storage in private or restricted modes.
    }
};

const validateOnboardingForm = (
    data: OnboardingForm,
    step: number,
): OnboardingValidationErrors => {
    const errors: OnboardingValidationErrors = {};

    if (step === 0) {
        (
            [
                ['first_name', 'First name'],
                ['last_name', 'Last name'],
                ['industry', 'Industry'],
                ['job_title', 'Job title'],
                ['location', 'Location'],
            ] as [keyof OnboardingForm, string][]
        ).forEach(([field, label]) => {
            const value = data[field];

            if (typeof value === 'string' && !value.trim()) {
                errors[field] = requiredMessage(label);
            }

            if (typeof value === 'string' && value.length > 255) {
                errors[field] = `${label} must be 255 characters or fewer.`;
            }
        });
    }

    if (step === 1) {
        (
            [
                ['education_school', 'School'],
                ['education_degree', 'Degree'],
                ['education_program', 'Program'],
            ] as [keyof OnboardingForm, string][]
        ).forEach(([field, label]) => {
            const value = data[field];

            if (typeof value === 'string' && !value.trim()) {
                errors[field] = requiredMessage(label);
            }

            if (typeof value === 'string' && value.length > 255) {
                errors[field] = `${label} must be 255 characters or fewer.`;
            }
        });
    }

    if (step === 2 && data.photo) {
        if (!data.photo.type.startsWith('image/')) {
            errors.photo = 'Picture must be an image file.';
        }

        if (data.photo.size > maxPhotoSize) {
            errors.photo = 'Picture must be 2 MB or smaller.';
        }
    }

    return errors;
};

export default function Onboarding({ user }: Props) {
    const draftKey = onboardingDraftKey(user.id);
    const [draft] = useState(() => readOnboardingDraft(draftKey));
    const [step, setStep] = useState(() => draft?.step ?? 0);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] =
        useState<OnboardingValidationErrors>({});
    const photoInputRef = useRef<HTMLInputElement>(null);
    const [firstName = '', ...otherNames] = user.name.split(' ');
    const defaultFormData: OnboardingForm = {
        first_name: firstName,
        last_name: otherNames.join(' '),
        industry: user.industry || '',
        job_title: user.job_title || '',
        location: user.location || '',
        education_school: user.education_school || '',
        education_degree: user.education_degree || '',
        education_program: user.education_program || '',
        avatar_preset: user.avatar_preset || 'career-mark',
        photo: null,
    };
    const form = useForm<OnboardingForm>({
        ...defaultFormData,
        ...draft?.data,
        photo: null,
    });
    const avatarFallback =
        `${form.data.first_name.charAt(0)}${form.data.last_name.charAt(0)}`.toUpperCase() ||
        'JT';
    const industryOptions = industries.includes(form.data.industry)
        ? industries
        : [form.data.industry, ...industries].filter(Boolean);
    const stepErrors = validateOnboardingForm(form.data, step);
    const canContinue = Object.keys(stepErrors).length === 0;

    useEffect(() => {
        return () => {
            if (photoPreview) {
                URL.revokeObjectURL(photoPreview);
            }
        };
    }, [photoPreview]);

    useEffect(() => {
        writeOnboardingDraft(draftKey, form.data, step);
    }, [draftKey, form.data, step]);

    const setFormData = (
        field: keyof OnboardingForm,
        value: string | File | null,
    ) => {
        const nextData = { ...form.data, [field]: value };

        form.setData(field, value);
        form.clearErrors(field);

        if (Object.keys(validationErrors).length > 0) {
            setValidationErrors(validateOnboardingForm(nextData, step));
        }
    };

    const fieldError = (field: keyof OnboardingForm) =>
        validationErrors[field] || form.errors[field];

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const errors = validateOnboardingForm(form.data, step);

        setValidationErrors(errors);

        if (Object.keys(errors).length > 0) {
            return;
        }

        if (step < 2) {
            setValidationErrors({});
            setStep((currentStep) => currentStep + 1);

            return;
        }

        form.post('/onboarding', {
            forceFormData: true,
            onSuccess: () => clearOnboardingDraft(draftKey),
        });
    };

    return (
        <>
            <Head title="Onboarding" />

            <div className="min-h-screen bg-[#eef3ef] px-4 py-6 dark:bg-background">
                <div className="mx-auto w-full max-w-4xl">
                    <Heading
                        title="Set up your profile"
                        description="Add your job search details before continuing."
                    />

                    <section className="rounded-lg border border-[#cbd8cf] bg-[#f8faf7] p-5 shadow-sm shadow-[#17201b]/5 sm:p-6 dark:border-[#33463a] dark:bg-[#16231c]">
                        <div className="mb-6 grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground">
                            {onboardingSteps.map(
                                ({ label, icon: Icon }, index) => (
                                    <div
                                        key={label}
                                        className={
                                            index <= step
                                                ? 'flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#17201b] px-3 py-2 text-center text-[#f4f8f2] dark:bg-[#f3c76a] dark:text-[#17201b]'
                                                : 'flex min-h-12 items-center justify-center gap-2 rounded-md border border-[#dce6df] bg-white/70 px-3 py-2 text-center dark:border-[#33463a] dark:bg-[#213128]/70'
                                        }
                                    >
                                        <Icon className="size-4 shrink-0" />
                                        {label}
                                    </div>
                                ),
                            )}
                        </div>

                        <form
                            onSubmit={submit}
                            className="grid gap-5"
                            noValidate
                        >
                            {step === 0 ? (
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="first_name">
                                            First name
                                        </Label>
                                        <Input
                                            id="first_name"
                                            value={form.data.first_name}
                                            onChange={(event) =>
                                                setFormData(
                                                    'first_name',
                                                    event.target.value,
                                                )
                                            }
                                            required
                                            autoFocus
                                            autoComplete="given-name"
                                            placeholder="First name"
                                        />
                                        <InputError
                                            message={fieldError('first_name')}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="last_name">
                                            Last name
                                        </Label>
                                        <Input
                                            id="last_name"
                                            value={form.data.last_name}
                                            onChange={(event) =>
                                                setFormData(
                                                    'last_name',
                                                    event.target.value,
                                                )
                                            }
                                            required
                                            autoComplete="family-name"
                                            placeholder="Last name"
                                        />
                                        <InputError
                                            message={fieldError('last_name')}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="industry">
                                            Industry
                                        </Label>
                                        <Select
                                            value={form.data.industry}
                                            onValueChange={(value) =>
                                                setFormData('industry', value)
                                            }
                                            required
                                        >
                                            <SelectTrigger
                                                id="industry"
                                                className="w-full"
                                            >
                                                <SelectValue placeholder="Select industry" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {industryOptions.map(
                                                    (industry) => (
                                                        <SelectItem
                                                            key={industry}
                                                            value={industry}
                                                        >
                                                            {industry}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={fieldError('industry')}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="job_title">
                                            Job title
                                        </Label>
                                        <Input
                                            id="job_title"
                                            value={form.data.job_title}
                                            onChange={(event) =>
                                                setFormData(
                                                    'job_title',
                                                    event.target.value,
                                                )
                                            }
                                            required
                                            autoComplete="organization-title"
                                            placeholder="Job title"
                                        />
                                        <InputError
                                            message={fieldError('job_title')}
                                        />
                                    </div>

                                    <div className="grid gap-2 sm:col-span-2">
                                        <Label htmlFor="location">
                                            Location
                                        </Label>
                                        <LocationSelect
                                            id="location"
                                            value={form.data.location}
                                            onChange={(value) =>
                                                setFormData('location', value)
                                            }
                                            placeholder="Select location"
                                        />
                                        <InputError
                                            message={fieldError('location')}
                                        />
                                    </div>
                                </div>
                            ) : null}

                            {step === 1 ? (
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="education_school">
                                            School
                                        </Label>
                                        <Input
                                            id="education_school"
                                            value={form.data.education_school}
                                            onChange={(event) =>
                                                setFormData(
                                                    'education_school',
                                                    event.target.value,
                                                )
                                            }
                                            required
                                            autoFocus
                                            placeholder="School"
                                        />
                                        <InputError
                                            message={fieldError(
                                                'education_school',
                                            )}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="education_degree">
                                            Degree
                                        </Label>
                                        <DegreeSelect
                                            id="education_degree"
                                            value={form.data.education_degree}
                                            onChange={(value) =>
                                                setFormData(
                                                    'education_degree',
                                                    value,
                                                )
                                            }
                                            placeholder="Select degree"
                                        />
                                        <InputError
                                            message={fieldError(
                                                'education_degree',
                                            )}
                                        />
                                    </div>

                                    <div className="grid gap-2 sm:col-span-2">
                                        <Label htmlFor="education_program">
                                            Program
                                        </Label>
                                        <Input
                                            id="education_program"
                                            value={form.data.education_program}
                                            onChange={(event) =>
                                                setFormData(
                                                    'education_program',
                                                    event.target.value,
                                                )
                                            }
                                            required
                                            placeholder="Program"
                                        />
                                        <InputError
                                            message={fieldError(
                                                'education_program',
                                            )}
                                        />
                                    </div>
                                </div>
                            ) : null}

                            {step === 2 ? (
                                <div className="grid gap-4">
                                    <AvatarPresetPicker
                                        value={form.data.avatar_preset}
                                        onChange={(value) => {
                                            const nextData = {
                                                ...form.data,
                                                avatar_preset: value,
                                                photo: null,
                                            };

                                            form.setData(nextData);
                                            form.clearErrors('avatar_preset');
                                            form.clearErrors('photo');
                                            setValidationErrors(
                                                validateOnboardingForm(
                                                    nextData,
                                                    step,
                                                ),
                                            );
                                            setPhotoPreview(null);

                                            if (photoInputRef.current) {
                                                photoInputRef.current.value =
                                                    '';
                                            }
                                        }}
                                        currentAvatar={
                                            photoPreview || user.avatar
                                        }
                                        fallback={avatarFallback}
                                    />

                                    <div className="grid gap-2">
                                        <Label htmlFor="photo">Picture</Label>
                                        <Input
                                            id="photo"
                                            ref={photoInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={(event) => {
                                                const file =
                                                    event.target.files?.[0] ??
                                                    null;
                                                const nextData = {
                                                    ...form.data,
                                                    avatar_preset: file
                                                        ? ''
                                                        : form.data
                                                              .avatar_preset,
                                                    photo: file,
                                                };

                                                form.setData(nextData);
                                                form.clearErrors(
                                                    'avatar_preset',
                                                );
                                                form.clearErrors('photo');
                                                setValidationErrors(
                                                    validateOnboardingForm(
                                                        nextData,
                                                        step,
                                                    ),
                                                );
                                                setPhotoPreview(
                                                    file
                                                        ? URL.createObjectURL(
                                                              file,
                                                          )
                                                        : null,
                                                );
                                            }}
                                            autoFocus
                                        />
                                        <InputError
                                            message={fieldError('photo')}
                                        />
                                        <InputError
                                            message={fieldError(
                                                'avatar_preset',
                                            )}
                                        />
                                    </div>
                                </div>
                            ) : null}

                            <div className="flex items-center justify-between gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={step === 0 || form.processing}
                                    onClick={() => {
                                        setValidationErrors({});
                                        setStep(
                                            (currentStep) => currentStep - 1,
                                        );
                                    }}
                                >
                                    Back
                                </Button>

                                <Button
                                    type="submit"
                                    disabled={form.processing || !canContinue}
                                    data-test="complete-onboarding-button"
                                >
                                    {form.processing && <Spinner />}
                                    {step === 2 ? 'Complete setup' : 'Continue'}
                                </Button>
                            </div>
                        </form>
                    </section>
                </div>
            </div>
        </>
    );
}
