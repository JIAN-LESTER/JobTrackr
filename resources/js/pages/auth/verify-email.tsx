import { Form, Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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

            <Dialog open>
                <DialogContent className="sm:max-w-md [&>button]:hidden">
                    <DialogHeader>
                        <DialogTitle>Verify your email</DialogTitle>
                        <DialogDescription>
                            Check your inbox for the verification link before
                            continuing to JobTrackr.
                        </DialogDescription>
                    </DialogHeader>

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

                    <DialogFooter className="sm:justify-center">
                        <Form {...logout.form()}>
                            <Button
                                type="submit"
                                variant="link"
                                className="h-auto p-0"
                            >
                                Wrong account? Log out
                            </Button>
                        </Form>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

VerifyEmail.layout = {
    modalOnly: true,
};
