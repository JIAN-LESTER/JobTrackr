import { Head, useForm } from '@inertiajs/react';
import { ListTodo, MailCheck, ShieldCheck } from 'lucide-react';
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
};

type RegisterForm = {
    email: string;
    password: string;
    password_confirmation: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register({ passwordRules }: Props) {
    const form = useForm<RegisterForm>({
        email: '',
        password: '',
        password_confirmation: '',
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
        } else if (form.data.password.length < 8) {
            form.setError('password', 'Password must be at least 8 characters.');
            hasErrors = true;
        }

        if (!form.data.password_confirmation) {
            form.setError(
                'password_confirmation',
                'Confirm your password.',
            );
            hasErrors = true;
        } else if (form.data.password_confirmation !== form.data.password) {
            form.setError(
                'password_confirmation',
                'Password confirmation does not match.',
            );
            hasErrors = true;
        }

        if (hasErrors) {
            return;
        }

        form.post(store.url(), {
            onSuccess: () =>
                form.reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Register" />
            <form
                onSubmit={submit}
                noValidate
                className="flex flex-col gap-6"
            >
                <div className="grid gap-6">
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
                                form.clearErrors('email');
                            }}
                            placeholder="email@example.com"
                        />
                        <InputError message={form.errors.email} />
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
                                form.clearErrors(
                                    'password',
                                    'password_confirmation',
                                );
                            }}
                            placeholder="Password"
                            passwordrules={passwordRules}
                        />
                        <InputError message={form.errors.password} />
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
                                form.clearErrors('password_confirmation');
                            }}
                            placeholder="Confirm password"
                            passwordrules={passwordRules}
                        />
                        <InputError
                            message={form.errors.password_confirmation}
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
    side: (
        <div className="flex h-full flex-col gap-8 rounded-md bg-[#17201b] p-6 text-white shadow-2xl shadow-black/20 ring-1 ring-white/10 sm:p-8 lg:min-h-[500px]">
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
    ),
};
