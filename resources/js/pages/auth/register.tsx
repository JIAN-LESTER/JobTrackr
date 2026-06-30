import { Form, Head } from '@inertiajs/react';
import { CheckCircle2, ListTodo, ShieldCheck } from 'lucide-react';
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

export default function Register({ passwordRules }: Props) {
    return (
        <>
            <Head title="Register" />
            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder="Full name"
                                />
                                <InputError
                                    message={errors.name}
                                    className="mt-2"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <PasswordInput
                                    id="password"
                                    required
                                    tabIndex={3}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="Password"
                                    passwordrules={passwordRules}
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">
                                    Confirm password
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    required
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="Confirm password"
                                    passwordrules={passwordRules}
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 w-full"
                                tabIndex={5}
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}
                                Create account
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <TextLink href={login()} tabIndex={6}>
                                Log in
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: 'Register to JobTrackr',
    description: 'Add your details to start tracking applications.',
    sidePosition: 'right',
    side: (
        <div className="flex h-full flex-col justify-between gap-5 rounded-md bg-[#17201b] p-6 text-white shadow-2xl shadow-black/20 ring-1 ring-white/10 sm:p-8 lg:min-h-[500px]">
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
                    <CheckCircle2 className="mt-0.5 size-5 text-[#f3c76a]" />
                    <div>
                        <p className="font-medium">Create your profile</p>
                        <p className="text-white/65">
                            Add your name and email so your workspace is ready.
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

            <div className="rounded-md bg-white/10 p-4 text-sm ring-1 ring-white/10">
                <p className="font-medium">Ready in minutes</p>
                <p className="mt-1 text-white/65">
                    Sign up, add your first role, and keep every next step in
                    view.
                </p>
            </div>
        </div>
    ),
};
