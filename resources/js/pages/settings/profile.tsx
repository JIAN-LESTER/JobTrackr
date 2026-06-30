import { Form, Head, usePage } from '@inertiajs/react';
import { useRef } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import AppearanceTabs from '@/components/appearance-tabs';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { logout } from '@/routes';
import { edit } from '@/routes/profile';
import type { Auth } from '@/types';

type PageProps = {
    auth?: Auth;
    user?: Auth['user'];
    passwordRules?: string;
    profileDocuments: {
        document_type: 'photo';
        file_name: string;
    }[];
};

export default function Profile() {
    const {
        auth,
        user: profileUser,
        passwordRules = '',
        profileDocuments = [],
    } = usePage<PageProps>().props;
    const user = auth?.user ?? profileUser;
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);
    const latestPhoto = profileDocuments.find(
        (document) => document.document_type === 'photo',
    );

    if (!user) {
        return null;
    }

    return (
        <>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <div className="mx-auto w-full max-w-screen-2xl px-4 py-6">
                <Heading
                    title="Profile"
                    description="Manage your profile and account settings"
                />

                <div className="grid gap-5">
                    <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
                    <section className="rounded-lg border bg-card p-5 shadow-xs sm:p-6">
                        <Heading
                            variant="small"
                            title="Account information"
                            description="Update your name, email, and profile details"
                        />

                        <Form
                            {...ProfileController.update.form()}
                            encType="multipart/form-data"
                            options={{
                                preserveScroll: true,
                            }}
                            className="mt-5 grid gap-5 sm:grid-cols-2"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Name</Label>

                                        <Input
                                            id="name"
                                            className="block w-full"
                                            defaultValue={user.name}
                                            name="name"
                                            required
                                            autoComplete="name"
                                            placeholder="Full name"
                                        />

                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="email">
                                            Email address
                                        </Label>

                                        <Input
                                            id="email"
                                            type="email"
                                            className="block w-full"
                                            defaultValue={user.email}
                                            name="email"
                                            required
                                            autoComplete="username"
                                            placeholder="Email address"
                                        />

                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="industry">
                                            Industry
                                        </Label>

                                        <Input
                                            id="industry"
                                            className="block w-full"
                                            defaultValue={user.industry || ''}
                                            name="industry"
                                            placeholder="Industry"
                                        />

                                        <InputError
                                            message={errors.industry}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="job_title">
                                            Job title
                                        </Label>

                                        <Input
                                            id="job_title"
                                            className="block w-full"
                                            defaultValue={user.job_title || ''}
                                            name="job_title"
                                            autoComplete="organization-title"
                                            placeholder="Job title"
                                        />

                                        <InputError
                                            message={errors.job_title}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="location">
                                            Location
                                        </Label>

                                        <Input
                                            id="location"
                                            className="block w-full"
                                            defaultValue={user.location || ''}
                                            name="location"
                                            autoComplete="address-level2"
                                            placeholder="Location"
                                        />

                                        <InputError
                                            message={errors.location}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="education_school">
                                            School
                                        </Label>

                                        <Input
                                            id="education_school"
                                            className="block w-full"
                                            defaultValue={
                                                user.education_school || ''
                                            }
                                            name="education_school"
                                            placeholder="School"
                                        />

                                        <InputError
                                            message={errors.education_school}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="education_degree">
                                            Degree
                                        </Label>

                                        <Input
                                            id="education_degree"
                                            className="block w-full"
                                            defaultValue={
                                                user.education_degree || ''
                                            }
                                            name="education_degree"
                                            placeholder="Degree"
                                        />

                                        <InputError
                                            message={errors.education_degree}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="education_program">
                                            Program
                                        </Label>

                                        <Input
                                            id="education_program"
                                            className="block w-full"
                                            defaultValue={
                                                user.education_program || ''
                                            }
                                            name="education_program"
                                            placeholder="Program"
                                        />

                                        <InputError
                                            message={errors.education_program}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="photo">Picture</Label>

                                        <Input
                                            id="photo"
                                            type="file"
                                            className="block w-full"
                                            name="photo"
                                            accept="image/*"
                                        />

                                        {latestPhoto ? (
                                            <p className="truncate rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                                                Current: {latestPhoto.file_name}
                                            </p>
                                        ) : null}

                                        <InputError message={errors.photo} />
                                    </div>

                                    <div className="flex items-center gap-4 sm:col-span-2">
                                        <Button
                                            disabled={processing}
                                            data-test="update-profile-button"
                                        >
                                            Save changes
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    </section>

                    <section className="rounded-lg border bg-card p-5 shadow-xs sm:p-6">
                        <Heading
                            variant="small"
                            title="Update password"
                            description="Ensure your account is using a long, random password to stay secure"
                        />

                        <Form
                            {...SecurityController.update.form()}
                            options={{
                                preserveScroll: true,
                            }}
                            resetOnError={[
                                'password',
                                'password_confirmation',
                                'current_password',
                            ]}
                            resetOnSuccess
                            onError={(errors) => {
                                if (errors.password) {
                                    passwordInput.current?.focus();
                                }

                                if (errors.current_password) {
                                    currentPasswordInput.current?.focus();
                                }
                            }}
                            className="mt-5 space-y-4"
                        >
                            {({ errors, processing }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="current_password">
                                            Current password
                                        </Label>

                                        <PasswordInput
                                            id="current_password"
                                            ref={currentPasswordInput}
                                            name="current_password"
                                            className="block w-full"
                                            autoComplete="current-password"
                                            placeholder="Current password"
                                        />

                                        <InputError
                                            message={errors.current_password}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="password">
                                            New password
                                        </Label>

                                        <PasswordInput
                                            id="password"
                                            ref={passwordInput}
                                            name="password"
                                            className="block w-full"
                                            autoComplete="new-password"
                                            placeholder="New password"
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
                                            name="password_confirmation"
                                            className="block w-full"
                                            autoComplete="new-password"
                                            placeholder="Confirm password"
                                            passwordrules={passwordRules}
                                        />

                                        <InputError
                                            message={
                                                errors.password_confirmation
                                            }
                                        />
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <Button
                                            disabled={processing}
                                            data-test="update-password-button"
                                        >
                                            Save password
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    </section>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-3 lg:items-stretch">
                    <section className="h-full rounded-lg border bg-card p-5 shadow-xs sm:p-6 lg:min-h-52">
                        <Heading
                            variant="small"
                            title="Appearance settings"
                            description="Update the appearance settings for your account"
                        />
                        <div className="mt-5">
                            <AppearanceTabs />
                        </div>
                    </section>

                    <section className="h-full rounded-lg border bg-card p-5 shadow-xs sm:p-6 lg:min-h-52">
                        <Heading
                            variant="small"
                            title="Account actions"
                            description="Manage sign out and account deletion"
                        />

                        <Form {...logout.form()} className="mt-5">
                            {({ processing }) => (
                                <Button
                                    type="submit"
                                    variant="outline"
                                    disabled={processing}
                                    data-test="logout-button"
                                >
                                    Log out
                                </Button>
                            )}
                        </Form>
                    </section>

                    <section className="h-full rounded-lg border bg-card p-5 shadow-xs sm:p-6 lg:min-h-52">
                        <DeleteUser />
                    </section>
                    </div>
                </div>
            </div>
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: edit(),
        },
    ],
};
