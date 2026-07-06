import { Head, useForm, usePage } from '@inertiajs/react';
import { Bell, BriefcaseBusiness, History } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    canResetPassword: boolean;
    csrfToken: string;
    loginErrors?: LoginErrors;
};

type LoginForm = {
    email: string;
    password: string;
};

type LoginErrors = {
    email?: string;
    password?: string;
    default?: LoginErrors;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const loginErrorMessage = (errors?: LoginErrors) => {
    const source = errors?.default || errors;

    return source?.email || source?.password || '';
};

function SideContent() {
    return (
        <div className="flex h-full flex-col gap-8 rounded-md bg-[#17201b] p-6 text-white shadow-2xl ring-1 shadow-black/20 ring-white/10 sm:p-8 lg:min-h-[500px]">
            <div className="space-y-3">
                <p className="text-sm font-medium text-[#f3c76a]">
                    JobTrackr workspace
                </p>
                <h2 className="text-3xl font-semibold">
                    Pick up exactly where your job search left off.
                </h2>
                <p className="text-white/70">
                    Review saved roles, upcoming interviews, follow-ups, and
                    notes from one organized dashboard.
                </p>
            </div>

            <div className="grid gap-4 text-sm">
                <div className="flex gap-3">
                    <BriefcaseBusiness className="mt-0.5 size-5 text-[#f3c76a]" />
                    <div>
                        <p className="font-medium">Applications in order</p>
                        <p className="text-white/65">
                            Keep every role grouped by status and priority.
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <History className="mt-0.5 size-5 text-[#f3c76a]" />
                    <div>
                        <p className="font-medium">Progress you can trace</p>
                        <p className="text-white/65">
                            Follow each update from application to decision.
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Bell className="mt-0.5 size-5 text-[#f3c76a]" />
                    <div>
                        <p className="font-medium">Follow-ups remembered</p>
                        <p className="text-white/65">
                            See what needs attention before it slips away.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Login({
    canResetPassword,
    csrfToken,
    loginErrors = {},
}: Props) {
    const { errors = {} } = usePage<{ errors?: LoginErrors }>().props;
    const [validationErrors, setValidationErrors] = useState<LoginErrors>({});
    const [authMessage, setAuthMessage] = useState(
        loginErrors.email || loginErrors.password || '',
    );
    const [authMessageId, setAuthMessageId] = useState(0);
    const form = useForm<LoginForm>({
        email: '',
        password: '',
    });
    const pageErrors = errors.default || errors;
    const propAuthMessage =
        loginErrorMessage(loginErrors) || loginErrorMessage(pageErrors);

    const showLoginError = (message: string) => {
        setAuthMessage(message);
        setAuthMessageId((id) => id + 1);
    };

    useEffect(() => {
        if (!authMessage) {
            return;
        }

        const timeout = window.setTimeout(() => setAuthMessage(''), 3000);

        return () => window.clearTimeout(timeout);
    }, [authMessage, authMessageId]);

    useEffect(() => {
        if (propAuthMessage) {
            showLoginError(propAuthMessage);
        }
    }, [propAuthMessage]);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.clearErrors();
        setValidationErrors({});
        setAuthMessage('');

        const email = form.data.email.trim();
        const nextErrors: LoginErrors = {};

        if (!email) {
            nextErrors.email = 'Email address is required.';
        } else if (!emailPattern.test(email)) {
            nextErrors.email = 'Enter a valid email address.';
        }

        if (!form.data.password) {
            nextErrors.password = 'Password is required.';
        }

        if (nextErrors.email || nextErrors.password) {
            setValidationErrors(nextErrors);
            return;
        }

        form.post(store.url(), {
            onError: (errors) => {
                showLoginError(
                    loginErrorMessage(errors) ||
                        'The provided credentials are incorrect.',
                );
            },
            onSuccess: (page) => {
                const props = page.props as {
                    errors?: LoginErrors;
                    loginErrors?: LoginErrors;
                };
                const message =
                    loginErrorMessage(props.loginErrors) ||
                    loginErrorMessage(props.errors);

                if (message) {
                    showLoginError(message);
                    return;
                }

                form.reset('password');
            },
        });
    };

    return (
        <>
            <Head title="Log in" />

            <form
                action={store.url()}
                method="post"
                onSubmit={submit}
                noValidate
                className="flex flex-col gap-6"
            >
                <input type="hidden" name="_token" value={csrfToken} />
                <div className="grid gap-6">
                    {authMessage && (
                        <div
                            role="alert"
                            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300"
                        >
                            {authMessage}
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
                                setValidationErrors((errors) => ({
                                    ...errors,
                                    email: undefined,
                                }));
                            }}
                            autoFocus
                            tabIndex={1}
                            autoComplete="email"
                            placeholder="Enter email address"
                            aria-invalid={!!validationErrors.email}
                        />
                        <InputError message={validationErrors.email} />
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center">
                            <Label htmlFor="password">Password</Label>
                            {canResetPassword && (
                                <TextLink
                                    href={request()}
                                    className="ml-auto text-sm"
                                    tabIndex={5}
                                >
                                    Forgot your password?
                                </TextLink>
                            )}
                        </div>
                        <PasswordInput
                            id="password"
                            name="password"
                            value={form.data.password}
                            onChange={(event) => {
                                form.setData('password', event.target.value);
                                setValidationErrors((errors) => ({
                                    ...errors,
                                    password: undefined,
                                }));
                            }}
                            tabIndex={2}
                            autoComplete="current-password"
                            placeholder="Enter Password"
                            aria-invalid={!!validationErrors.password}
                        />
                        <InputError message={validationErrors.password} />
                    </div>

                    <Button
                        type="submit"
                        className="mt-4 w-full"
                        tabIndex={4}
                        disabled={form.processing}
                        data-test="login-button"
                    >
                        {form.processing && <Spinner />}
                        Log in
                    </Button>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <TextLink href={register()} tabIndex={5}>
                        Sign up
                    </TextLink>
                </div>
            </form>
        </>
    );
}

Login.layout = {
    title: 'JobTrackr',
    description: 'Sign in to continue managing your job search.',
    sidePosition: 'left',
    side: <SideContent />,
};
