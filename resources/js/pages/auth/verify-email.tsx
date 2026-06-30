import { Form, Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

type Props = {
    status?: string;
};

export default function VerifyEmail({ status }: Props) {
    return (
        <>
            <Head title="Verify email" />

            {status === 'verification-link-sent' && (
                <div className="mb-4 rounded-md bg-green-50 p-3 text-center text-sm font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
                    A new verification link has been sent.
                </div>
            )}

            <Form {...send.form()}>
                {({ processing }) => (
                    <div className="grid gap-6">
                        <p className="text-center text-sm text-muted-foreground">
                            Check your inbox for the verification link before
                            continuing to JobTrackr.
                        </p>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={processing}
                        >
                            {processing && <Spinner />}
                            Resend verification email
                        </Button>
                    </div>
                )}
            </Form>

            <Form {...logout.form()} className="mt-6 text-center">
                <Button type="submit" variant="link" className="h-auto p-0">
                    Wrong account? Log out
                </Button>
            </Form>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Verify your email',
    description: 'Confirm your email address to continue.',
};
