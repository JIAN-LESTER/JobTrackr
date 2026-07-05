import { Form, Head } from '@inertiajs/react';
import { ListTodo, MailCheck, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

type Props = {
    status?: string;
};

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

export default function VerifyEmail({ status }: Props) {
    return (
        <>
            <Head title="Verify email" />

            <div className="flex flex-col gap-6">
                {status === 'verification-link-sent' && (
                    <div className="rounded-md bg-green-50 p-3 text-center text-sm font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
                        A new verification link has been sent.
                    </div>
                )}

                <Form {...send.form()}>
                    {({ processing }) => (
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={processing}
                        >
                            {processing && <Spinner />}
                            Resend verification email
                        </Button>
                    )}
                </Form>

                <div className="text-center">
                    <Form {...logout.form()}>
                        <Button
                            type="submit"
                            variant="link"
                            className="h-auto p-0"
                        >
                            Wrong account? Log out
                        </Button>
                    </Form>
                </div>
            </div>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Verify your email',
    description:
        'Check your inbox for the verification link before continuing to JobTrackr.',
    sidePosition: 'right',
    side: <SideContent />,
};
