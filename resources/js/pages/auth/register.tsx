import { Head, useForm, usePage } from '@inertiajs/react';
import { ListTodo, MailCheck, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';

type Props = {
    passwordRules: string;
    csrfToken: string;
    registerErrors?: RegisterErrors;
};

type RegisterForm = {
    email: string;
    password: string;
    password_confirmation: string;
};

type RegisterErrors = {
    email?: string;
    password?: string;
    password_confirmation?: string;
    default?: RegisterErrors;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const symbolPattern = /[^A-Za-z0-9]/;

type PasswordRequirement = {
    label: string;
    met: boolean;
};

function getMinimumPasswordLength(passwordRules: string): number {
    const match = passwordRules.match(/min(?:length)?\s*:?\s*(\d+)/i);

    return match ? Number(match[1]) : 8;
}

function getPasswordRequirements(
    password: string,
    passwordRules: string,
): PasswordRequirement[] {
    const rules = passwordRules.toLowerCase();
    const minimumLength = getMinimumPasswordLength(passwordRules);
    const requirements: PasswordRequirement[] = [
        {
            label: `Minimum ${minimumLength} characters`,
            met: password.length >= minimumLength,
        },
    ];

    if (rules.includes('lower')) {
        requirements.push({
            label: 'At least 1 lowercase letter',
            met: /[a-z]/.test(password),
        });
    }

    if (rules.includes('upper')) {
        requirements.push({
            label: 'At least 1 uppercase letter',
            met: /[A-Z]/.test(password),
        });
    }

    if (rules.includes('digit') || rules.includes('number')) {
        requirements.push({
            label: 'At least 1 number',
            met: /\d/.test(password),
        });
    }

    if (
        rules.includes('symbol') ||
        rules.includes('special') ||
        /required\s*:\s*\[[^\]]+\]/.test(rules)
    ) {
        requirements.push({
            label: 'At least 1 special character',
            met: symbolPattern.test(password),
        });
    }

    return requirements;
}

function PasswordInstructions({ minimumLength }: { minimumLength: number }) {
    return (
        <p className="text-sm text-muted-foreground">
            Use at least {minimumLength} characters and a strong password.
        </p>
    );
}

const registerErrorMessage = (errors?: RegisterErrors) => {
    const source = errors?.default || errors;

    return (
        source?.email || source?.password || source?.password_confirmation || ''
    );
};

// Shared side panel content — reused in the mobile dialog
function SideContent() {
    return (
        <div className="flex h-full flex-col gap-8 rounded-md bg-[#17201b] p-6 text-white shadow-2xl ring-1 shadow-black/20 ring-white/10 sm:p-8 lg:min-h-[500px]">
            <div className="space-y-3">
                <p className="text-sm font-medium text-[#f3c76a]">
                    Account setup
                </p>
                <h2 className="text-3xl font-semibold">
                    Start with a clean system for every opportunity.
                </h2>
                <p className="text-white/70">
                    Create your account, set your password, then begin tracking
                    roles, interviews, reminders, and decisions.
                </p>
            </div>

            <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                    <MailCheck className="mt-0.5 size-5 text-[#f3c76a]" />
                    <div>
                        <p className="font-medium">Verify your email</p>
                        <p className="text-white/65">
                            Confirm your address before opening your workspace.
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <ShieldCheck className="mt-0.5 size-5 text-[#f3c76a]" />
                    <div>
                        <p className="font-medium">Protect your access</p>
                        <p className="text-white/65">
                            Choose a password that keeps your job search data
                            secure.
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <ListTodo className="mt-0.5 size-5 text-[#f3c76a]" />
                    <div>
                        <p className="font-medium">Build your pipeline</p>
                        <p className="text-white/65">
                            Add applications and keep the next action visible.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Register({
    passwordRules,
    csrfToken,
    registerErrors = {},
}: Props) {
    const { errors = {} } = usePage<{ errors?: RegisterErrors }>().props;
    const [validationErrors, setValidationErrors] = useState<RegisterErrors>(
        {},
    );
    const pageErrors = errors.default || errors;
    const [serverMessage, setServerMessage] = useState(
        registerErrorMessage(registerErrors) ||
            registerErrorMessage(pageErrors),
    );
    const [serverMessageId, setServerMessageId] = useState(0);
    const form = useForm<RegisterForm>({
        email: '',
        password: '',
        password_confirmation: '',
    });
    const minimumPasswordLength = getMinimumPasswordLength(passwordRules);
    const passwordRequirements = getPasswordRequirements(
        form.data.password,
        passwordRules,
    );
    const unmetPasswordRequirements = passwordRequirements.filter(
        (requirement) => !requirement.met,
    );

    const showServerMessage = (message: string) => {
        setServerMessage(message);
        setServerMessageId((id) => id + 1);
    };

    useEffect(() => {
        if (!serverMessage) {
            return;
        }

        const timeout = window.setTimeout(() => setServerMessage(''), 3000);

        return () => window.clearTimeout(timeout);
    }, [serverMessage, serverMessageId]);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.clearErrors();
        setValidationErrors({});
        setServerMessage('');

        const email = form.data.email.trim();
        const nextErrors: RegisterErrors = {};

        if (!email) {
            nextErrors.email = 'Email address is required.';
        } else if (!emailPattern.test(email)) {
            nextErrors.email = 'Enter a valid email address.';
        }

        if (!form.data.password) {
            nextErrors.password = 'Password is required.';
        } else if (unmetPasswordRequirements.length > 0) {
            nextErrors.password = `Password must satisfy: ${unmetPasswordRequirements
                .map((requirement) => requirement.label.toLowerCase())
                .join(', ')}.`;
        }

        if (!form.data.password_confirmation) {
            nextErrors.password_confirmation = 'Confirm your password.';
        } else if (form.data.password_confirmation !== form.data.password) {
            nextErrors.password_confirmation =
                'Password confirmation does not match.';
        }

        if (
            nextErrors.email ||
            nextErrors.password ||
            nextErrors.password_confirmation
        ) {
            setValidationErrors(nextErrors);

            return;
        }

        form.transform((data) => ({
            ...data,
            email,
        }));

        form.post(store.url(), {
            preserveScroll: true,
            onError: (errors) => {
                showServerMessage(
                    registerErrorMessage(errors) || 'Could not create account.',
                );
            },
            onSuccess: (page) => {
                const props = page.props as {
                    errors?: RegisterErrors;
                    registerErrors?: RegisterErrors;
                };
                const message =
                    registerErrorMessage(props.registerErrors) ||
                    registerErrorMessage(props.errors);

                if (message) {
                    showServerMessage(message);

                    return;
                }

                form.reset('password', 'password_confirmation');
            },
        });
    };

    return (
        <>
            <Head title="Register" />

            <form
                action={store.url()}
                method="post"
                onSubmit={submit}
                noValidate
                className="flex flex-col gap-6"
            >
                <input type="hidden" name="_token" value={csrfToken} />
                <div className="grid gap-6">
                    {serverMessage && (
                        <div
                            role="alert"
                            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300"
                        >
                            {serverMessage}
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            autoFocus
                            tabIndex={1}
                            autoComplete="email"
                            name="email"
                            value={form.data.email}
                            onChange={(event) => {
                                form.setData('email', event.target.value);
                                setValidationErrors((errors) => ({
                                    ...errors,
                                    email: undefined,
                                }));
                            }}
                            placeholder="email@example.com"
                            aria-invalid={!!validationErrors.email}
                            aria-describedby={
                                validationErrors.email
                                    ? 'email-error'
                                    : undefined
                            }
                        />
                        {validationErrors.email ? (
                            <p
                                id="email-error"
                                className="text-sm text-red-600 dark:text-red-400"
                            >
                                {validationErrors.email}
                            </p>
                        ) : null}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <PasswordInput
                            id="password"
                            tabIndex={2}
                            autoComplete="new-password"
                            name="password"
                            value={form.data.password}
                            onChange={(event) => {
                                form.setData('password', event.target.value);
                                setValidationErrors((errors) => ({
                                    ...errors,
                                    password: undefined,
                                    password_confirmation: undefined,
                                }));
                            }}
                            placeholder="Password"
                            passwordrules={passwordRules}
                            aria-invalid={!!validationErrors.password}
                        />
                        <PasswordInstructions
                            minimumLength={minimumPasswordLength}
                        />
                        <InputError message={validationErrors.password} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">
                            Confirm password
                        </Label>
                        <PasswordInput
                            id="password_confirmation"
                            tabIndex={3}
                            autoComplete="new-password"
                            name="password_confirmation"
                            value={form.data.password_confirmation}
                            onChange={(event) => {
                                form.setData(
                                    'password_confirmation',
                                    event.target.value,
                                );
                                setValidationErrors((errors) => ({
                                    ...errors,
                                    password_confirmation: undefined,
                                }));
                            }}
                            placeholder="Confirm password"
                            passwordrules={passwordRules}
                            aria-invalid={
                                !!validationErrors.password_confirmation
                            }
                        />
                        <InputError
                            message={validationErrors.password_confirmation}
                        />
                    </div>

                    <Button
                        type="submit"
                        className="mt-2 w-full"
                        tabIndex={4}
                        disabled={form.processing}
                        data-test="register-user-button"
                    >
                        {form.processing && <Spinner />}
                        Create account
                    </Button>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <TextLink href={login()} tabIndex={5}>
                        Log in
                    </TextLink>
                </div>
            </form>
        </>
    );
}

Register.layout = {
    title: 'Register to JobTrackr',
    description: 'Create your account to start tracking applications.',
    sidePosition: 'right',
    side: <SideContent />,
};
