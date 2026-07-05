import { Head, useForm } from '@inertiajs/react';
import { Bell, BriefcaseBusiness, History } from 'lucide-react';
import type { FormEvent } from 'react';
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
};

type LoginForm = {
    email: string;
    password: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export default function Login({ canResetPassword, csrfToken }: Props) {
    const form = useForm<LoginForm>({
        email: '',
        password: '',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.clearErrors();

        const email = form.data.email.trim();
        let hasErrors = false;

        if (!email) {
            form.setError('email', 'Email address is required.');
            hasErrors = true;
        } else if (!emailPattern.test(email)) {
            form.setError('email', 'Enter a valid email address.');
            hasErrors = true;
        }

        if (!form.data.password) {
            form.setError('password', 'Password is required.');
            hasErrors = true;
        }

        if (hasErrors) {
            return;
        }

        form.post(store.url(), {
            onSuccess: () => form.reset('password'),
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
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            value={form.data.email}
                            onChange={(event) => {
                                form.setData('email', event.target.value);
                                form.clearErrors('email');
                            }}
                            autoFocus
                            tabIndex={1}
                            autoComplete="email"
                            placeholder="Enter email address"
                            aria-invalid={!!form.errors.email}
                        />
                        <InputError message={form.errors.email} />
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
                                form.clearErrors('password');
                            }}
                            tabIndex={2}
                            autoComplete="current-password"
                            placeholder="Enter Password"
                            aria-invalid={!!form.errors.password}
                        />
                        <InputError message={form.errors.password} />
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
