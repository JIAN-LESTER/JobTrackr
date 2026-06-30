import { Head, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import AvatarPresetPicker from '@/components/avatar-preset-picker';
import DegreeSelect from '@/components/degree-select';
import InputError from '@/components/input-error';
import Heading from '@/components/heading';
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

export default function Onboarding({ user }: Props) {
    const [step, setStep] = useState(0);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const photoInputRef = useRef<HTMLInputElement>(null);
    const [firstName = '', ...otherNames] = user.name.split(' ');
    const form = useForm<OnboardingForm>({
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
    });
    const avatarFallback =
        `${form.data.first_name.charAt(0)}${form.data.last_name.charAt(0)}`.toUpperCase() ||
        'JT';
    const industryOptions = industries.includes(form.data.industry)
        ? industries
        : [form.data.industry, ...industries].filter(Boolean);

    useEffect(() => {
        return () => {
            if (photoPreview) {
                URL.revokeObjectURL(photoPreview);
            }
        };
    }, [photoPreview]);

    const canContinue =
        step === 0
            ? Boolean(
                  form.data.first_name.trim() &&
                      form.data.last_name.trim() &&
                      form.data.industry.trim() &&
                      form.data.job_title.trim() &&
                      form.data.location.trim(),
              )
            : Boolean(
                  form.data.education_school.trim() &&
                      form.data.education_degree.trim() &&
                      form.data.education_program.trim(),
              );

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (step < 2) {
            if (canContinue) {
                setStep((currentStep) => currentStep + 1);
            }

            return;
        }

        form.post('/onboarding', {
            forceFormData: true,
        });
    };

    return (
        <>
            <Head title="Onboarding" />

            <div className="mx-auto w-full max-w-3xl px-4 py-6">
                <Heading
                    title="Set up your profile"
                    description="Add your job search details before continuing."
                />

                <section className="rounded-lg border bg-card p-5 shadow-xs sm:p-6">
                    <div className="mb-5 grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground">
                        {['Career', 'Education', 'Picture'].map(
                            (label, index) => (
                                <div
                                    key={label}
                                    className={
                                        index <= step
                                            ? 'rounded-md bg-primary px-3 py-2 text-center text-primary-foreground'
                                            : 'rounded-md bg-muted px-3 py-2 text-center'
                                    }
                                >
                                    {label}
                                </div>
                            ),
                        )}
                    </div>

                    <form onSubmit={submit} className="grid gap-5">
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
                                            form.setData(
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
                                        message={form.errors.first_name}
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
                                            form.setData(
                                                'last_name',
                                                event.target.value,
                                            )
                                        }
                                        required
                                        autoComplete="family-name"
                                        placeholder="Last name"
                                    />
                                    <InputError
                                        message={form.errors.last_name}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="industry">Industry</Label>
                                    <Select
                                        value={form.data.industry}
                                        onValueChange={(value) =>
                                            form.setData('industry', value)
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
                                        message={form.errors.industry}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="job_title">Job title</Label>
                                    <Input
                                        id="job_title"
                                        value={form.data.job_title}
                                        onChange={(event) =>
                                            form.setData(
                                                'job_title',
                                                event.target.value,
                                            )
                                        }
                                        required
                                        autoComplete="organization-title"
                                        placeholder="Job title"
                                    />
                                    <InputError
                                        message={form.errors.job_title}
                                    />
                                </div>

                                <div className="grid gap-2 sm:col-span-2">
                                    <Label htmlFor="location">Location</Label>
                                    <LocationSelect
                                        id="location"
                                        value={form.data.location}
                                        onChange={(value) =>
                                            form.setData('location', value)
                                        }
                                        placeholder="Select location"
                                    />
                                    <InputError
                                        message={form.errors.location}
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
                                            form.setData(
                                                'education_school',
                                                event.target.value,
                                            )
                                        }
                                        required
                                        autoFocus
                                        placeholder="School"
                                    />
                                    <InputError
                                        message={
                                            form.errors.education_school
                                        }
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
                                            form.setData(
                                                'education_degree',
                                                value,
                                            )
                                        }
                                        placeholder="Select degree"
                                    />
                                    <InputError
                                        message={
                                            form.errors.education_degree
                                        }
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
                                            form.setData(
                                                'education_program',
                                                event.target.value,
                                            )
                                        }
                                        required
                                        placeholder="Program"
                                    />
                                    <InputError
                                        message={
                                            form.errors.education_program
                                        }
                                    />
                                </div>
                            </div>
                        ) : null}

                        {step === 2 ? (
                            <div className="grid gap-4">
                                <AvatarPresetPicker
                                    value={form.data.avatar_preset}
                                    onChange={(value) => {
                                        form.setData('avatar_preset', value);
                                        form.setData('photo', null);
                                        setPhotoPreview(null);
                                        if (photoInputRef.current) {
                                            photoInputRef.current.value = '';
                                        }
                                    }}
                                    currentAvatar={photoPreview || user.avatar}
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
                                                event.target.files?.[0] ?? null;
                                            form.setData('photo', file);
                                            setPhotoPreview(
                                                file
                                                    ? URL.createObjectURL(file)
                                                    : null,
                                            );
                                            if (file) {
                                                form.setData(
                                                    'avatar_preset',
                                                    '',
                                                );
                                            }
                                        }}
                                        autoFocus
                                    />
                                    <InputError message={form.errors.photo} />
                                    <InputError
                                        message={form.errors.avatar_preset}
                                    />
                                </div>
                            </div>
                        ) : null}

                        <div className="flex items-center justify-between gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={step === 0 || form.processing}
                                onClick={() =>
                                    setStep((currentStep) => currentStep - 1)
                                }
                            >
                                Back
                            </Button>

                            <Button
                                type="submit"
                                disabled={
                                    form.processing ||
                                    (step < 2 && !canContinue)
                                }
                                data-test="complete-onboarding-button"
                            >
                                {form.processing && <Spinner />}
                                {step === 2 ? 'Complete setup' : 'Continue'}
                            </Button>
                        </div>
                    </form>
                </section>
            </div>
        </>
    );
}
