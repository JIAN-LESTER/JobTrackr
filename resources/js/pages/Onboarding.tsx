import { Head, useForm } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import InputError from '@/components/input-error';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import type { Auth } from '@/types';

type Props = {
    user: Auth['user'];
};

type OnboardingForm = {
    industry: string;
    job_title: string;
    location: string;
    education_school: string;
    education_degree: string;
    education_program: string;
    photo: File | null;
};

export default function Onboarding({ user }: Props) {
    const [step, setStep] = useState(0);
    const form = useForm<OnboardingForm>({
        industry: user.industry || '',
        job_title: user.job_title || '',
        location: user.location || '',
        education_school: user.education_school || '',
        education_degree: user.education_degree || '',
        education_program: user.education_program || '',
        photo: null,
    });

    const canContinue =
        step === 0
            ? Boolean(
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
                                    <Label htmlFor="industry">Industry</Label>
                                    <Input
                                        id="industry"
                                        value={form.data.industry}
                                        onChange={(event) =>
                                            form.setData(
                                                'industry',
                                                event.target.value,
                                            )
                                        }
                                        required
                                        autoFocus
                                        placeholder="Industry"
                                    />
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
                                    <Input
                                        id="location"
                                        value={form.data.location}
                                        onChange={(event) =>
                                            form.setData(
                                                'location',
                                                event.target.value,
                                            )
                                        }
                                        required
                                        autoComplete="address-level2"
                                        placeholder="Location"
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
                                    <Input
                                        id="education_degree"
                                        value={form.data.education_degree}
                                        onChange={(event) =>
                                            form.setData(
                                                'education_degree',
                                                event.target.value,
                                            )
                                        }
                                        required
                                        placeholder="Degree"
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
                            <div className="grid gap-2">
                                <Label htmlFor="photo">Picture</Label>
                                <Input
                                    id="photo"
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) =>
                                        form.setData(
                                            'photo',
                                            event.target.files?.[0] ?? null,
                                        )
                                    }
                                    autoFocus
                                />
                                <InputError message={form.errors.photo} />
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
