import { Head, useForm, usePage } from '@inertiajs/react';
import { KeyRound, MailCheck, ShieldCheck } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { email } from '@/routes/password';

type ForgotPasswordForm = {
    email: string;
};

type ForgotPasswordErrors = {
    email?: string;
    default?: ForgotPasswordErrors;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const forgotPasswordErrorMessage = (errors?: ForgotPasswordErrors) => {
    const source = errors?.default || errors;

    return source?.email || '';
};

function SideContent() {
    return (
        <div className="flex h-full flex-col gap-8 rounded-md bg-[#17201b] p-6 text-white shadow-2xl ring-1 shadow-black/20 ring-white/10 sm:p-8 lg:min-h-[500px]">
            <div className="space-y-3">
                <p className="text-sm font-medium text-[#f3c76a]">
                    Account recovery
                </p>
                <h2 className="text-3xl font-semibold">
                    Get back to your job search without losing momentum.
                </h2>
                <p className="text-white/70">
                    Request a secure reset link and return to your saved roles,
                    interviews, reminders, and notes.
                </p>
            </div>

            <div className="grid gap-4 text-sm">
                <div className="flex gap-3">
                    <MailCheck className="mt-0.5 size-5 text-[#f3c76a]" />
                    <div>
                        <p className="font-medium">Check your inbox</p>
                        <p className="text-white/65">
                            We will send reset instructions to your email.
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <ShieldCheck className="mt-0.5 size-5 text-[#f3c76a]" />
                    <div>
                        <p className="font-medium">Secure by design</p>
                        <p className="text-white/65">
                            Reset links are tied to your account request.
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <KeyRound className="mt-0.5 size-5 text-[#f3c76a]" />
                    <div>
                        <p className="font-medium">Choose a new password</p>
                        <p className="text-white/65">
                            Set fresh credentials before returning to work.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ForgotPassword({
    status,
    forgotPasswordErrors = {},
}: {
    status?: string;
    forgotPasswordErrors?: ForgotPasswordErrors;
}) {
    const { errors = {} } =
        usePage<{ errors?: ForgotPasswordErrors }>().props;
    const [validationErrors, setValidationErrors] =
        useState<ForgotPasswordErrors>({});
    const [serverMessage, setServerMessage] = useState(
        forgotPasswordErrorMessage(forgotPasswordErrors),
    );
    const [serverMessageId, setServerMessageId] = useState(0);
    const form = useForm<ForgotPasswordForm>({
        email: '',
    });
    const pageErrors = errors.default || errors;
    const propServerMessage =
        forgotPasswordErrorMessage(forgotPasswordErrors) ||
        forgotPasswordErrorMessage(pageErrors);

    const showServerMessage = (message: string) => {
        setServerMessage(message);
        setServerMessageId((id) => id + 1);
    };

    useEffect(() => {
        if (status) {
            toast.success(status);
        }
    }, [status]);

    useEffect(() => {
        if (!serverMessage) {
            return;
        }

        const timeout = window.setTimeout(() => setServerMessage(''), 3000);

        return () => window.clearTimeout(timeout);
    }, [serverMessage, serverMessageId]);

    useEffect(() => {
        if (propServerMessage) {
            showServerMessage(propServerMessage);
        }
    }, [propServerMessage]);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.clearErrors();
        setValidationErrors({});
        setServerMessage('');

        const emailAddress = form.data.email.trim();

        if (!emailAddress) {
            setValidationErrors({ email: 'Email address is required.' });

            return;
        }

        if (!emailPattern.test(emailAddress)) {
            setValidationErrors({ email: 'Enter a valid email address.' });

            return;
        }

        form.post(email.url(), {
            data: { email: emailAddress },
            onError: (errors) => {
                showServerMessage(
                    forgotPasswordErrorMessage(errors) ||
                        'Could not send password reset link.',
                );
            },
            onSuccess: (page) => {
                const props = page.props as {
                    errors?: ForgotPasswordErrors;
                    forgotPasswordErrors?: ForgotPasswordErrors;
                };
                const message =
                    forgotPasswordErrorMessage(props.forgotPasswordErrors) ||
                    forgotPasswordErrorMessage(props.errors);

                if (message) {
                    showServerMessage(message);
                }
            },
        });
    };

    return (
        <>
            <Head title="Forgot password" />

            <form onSubmit={submit} noValidate className="flex flex-col gap-6">
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
                            name="email"
                            value={form.data.email}
                            onChange={(event) => {
                                form.setData('email', event.target.value);
                                setValidationErrors({});
                            }}
                            autoFocus
                            tabIndex={1}
                            autoComplete="email"
                            placeholder="email@example.com"
                            aria-invalid={!!validationErrors.email}
                        />
                        <InputError message={validationErrors.email} />
                    </div>

                    <Button
                        type="submit"
                        className="mt-4 w-full"
                        tabIndex={2}
                        disabled={form.processing}
                        data-test="email-password-reset-link-button"
                    >
                        {form.processing && <Spinner />}
                        Email password reset link
                    </Button>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                    Remember your password?{' '}
                    <TextLink href={login()} tabIndex={3}>
                        Log in
                    </TextLink>
                </div>
            </form>
        </>
    );
}

ForgotPassword.layout = {
    title: 'Forgot password',
    description: 'Enter your email to receive a password reset link.',
    sidePosition: 'left',
    side: <SideContent />,
};
