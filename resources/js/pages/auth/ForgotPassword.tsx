import { Head, useForm } from '@inertiajs/react';
import { KeyRound, MailCheck, ShieldCheck } from 'lucide-react';
import { useEffect } from 'react';
import type { FormEvent } from 'react';
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

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export default function ForgotPassword({ status }: { status?: string }) {
    const form = useForm<ForgotPasswordForm>({
        email: '',
    });

    useEffect(() => {
        if (status) {
            toast.success(status);
        }
    }, [status]);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.clearErrors();

        const emailAddress = form.data.email.trim();

        if (!emailAddress) {
            form.setError('email', 'Email address is required.');

            return;
        }

        if (!emailPattern.test(emailAddress)) {
            form.setError('email', 'Enter a valid email address.');

            return;
        }

        form.post(email.url(), {
            data: { email: emailAddress },
        });
    };

    return (
        <>
            <Head title="Forgot password" />

            <form onSubmit={submit} noValidate className="flex flex-col gap-6">
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
                            placeholder="email@example.com"
                            aria-invalid={!!form.errors.email}
                        />
                        <InputError message={form.errors.email} />
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
