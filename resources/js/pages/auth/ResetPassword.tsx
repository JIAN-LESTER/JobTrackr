import { Head, useForm } from '@inertiajs/react';
import { KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { update } from '@/routes/password';

type Props = {
    token: string;
    email: string;
    passwordRules: string;
};

type ResetPasswordForm = {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
};

function SideContent() {
    return (
        <div className="flex h-full flex-col gap-8 rounded-md bg-[#17201b] p-6 text-white shadow-2xl ring-1 shadow-black/20 ring-white/10 sm:p-8 lg:min-h-[500px]">
            <div className="space-y-3">
                <p className="text-sm font-medium text-[#f3c76a]">
                    Password reset
                </p>
                <h2 className="text-3xl font-semibold">
                    Secure your account and return to your workspace.
                </h2>
                <p className="text-white/70">
                    Create a new password, then continue managing applications,
                    reminders, interviews, and decisions.
                </p>
            </div>

            <div className="grid gap-4 text-sm">
                <div className="flex gap-3">
                    <LockKeyhole className="mt-0.5 size-5 text-[#f3c76a]" />
                    <div>
                        <p className="font-medium">Fresh credentials</p>
                        <p className="text-white/65">
                            Replace your old password before signing in again.
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <ShieldCheck className="mt-0.5 size-5 text-[#f3c76a]" />
                    <div>
                        <p className="font-medium">Account protection</p>
                        <p className="text-white/65">
                            Use a password that keeps your workspace secure.
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <KeyRound className="mt-0.5 size-5 text-[#f3c76a]" />
                    <div>
                        <p className="font-medium">Back in control</p>
                        <p className="text-white/65">
                            Your job search data stays ready when you return.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ResetPassword({ token, email, passwordRules }: Props) {
    const form = useForm<ResetPasswordForm>({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.clearErrors();

        let hasErrors = false;

        if (!form.data.email) {
            form.setError('email', 'Email address is required.');
            hasErrors = true;
        }

        if (!form.data.password) {
            form.setError('password', 'Password is required.');
            hasErrors = true;
        } else if (form.data.password.length < 8) {
            form.setError(
                'password',
                'Password must be at least 8 characters.',
            );
            hasErrors = true;
        }

        if (!form.data.password_confirmation) {
            form.setError('password_confirmation', 'Confirm your password.');
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

        form.post(update.url(), {
            onSuccess: () => form.reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Reset password" />

            <form onSubmit={submit} noValidate className="flex flex-col gap-6">
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            autoComplete="email"
                            value={form.data.email}
                            tabIndex={1}
                            readOnly
                        />
                        <InputError message={form.errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <PasswordInput
                            id="password"
                            name="password"
                            value={form.data.password}
                            onChange={(event) => {
                                form.setData('password', event.target.value);
                                form.clearErrors(
                                    'password',
                                    'password_confirmation',
                                );
                            }}
                            tabIndex={2}
                            autoComplete="new-password"
                            autoFocus
                            placeholder="Password"
                            passwordrules={passwordRules}
                            aria-invalid={!!form.errors.password}
                        />
                        <InputError message={form.errors.password} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">
                            Confirm password
                        </Label>
                        <PasswordInput
                            id="password_confirmation"
                            name="password_confirmation"
                            value={form.data.password_confirmation}
                            onChange={(event) => {
                                form.setData(
                                    'password_confirmation',
                                    event.target.value,
                                );
                                form.clearErrors('password_confirmation');
                            }}
                            tabIndex={3}
                            autoComplete="new-password"
                            placeholder="Confirm password"
                            passwordrules={passwordRules}
                            aria-invalid={!!form.errors.password_confirmation}
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
                        data-test="reset-password-button"
                    >
                        {form.processing && <Spinner />}
                        Reset password
                    </Button>
                </div>
            </form>
        </>
    );
}

ResetPassword.layout = {
    title: 'Reset password',
    description: 'Choose a new password for your JobTrackr account.',
    sidePosition: 'right',
    side: <SideContent />,
};
