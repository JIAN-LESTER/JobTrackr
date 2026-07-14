import { Form, Head, usePage } from '@inertiajs/react';
import { FileText, Image } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import AvatarPresetPicker from '@/components/avatar-preset-picker';
import DegreeSelect from '@/components/degree-select';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import LocationSelect from '@/components/location-select';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInitials } from '@/hooks/use-initials';
import type { Auth } from '@/types';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import { logout } from '@/routes';
import { edit } from '@/routes/profile';

type PageProps = {
    auth?: Auth;
    user?: Auth['user'];
    passwordRules?: string;
    profileDocuments: {
        document_type: 'photo' | 'resume';
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
    const [avatarPreset, setAvatarPreset] = useState(
        typeof user?.avatar_preset === 'string' ? user.avatar_preset : '',
    );
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [location, setLocation] = useState(user?.location || '');
    const [degree, setDegree] = useState(user?.education_degree || '');
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);
    const photoInput = useRef<HTMLInputElement>(null);
    const getInitials = useInitials();
    const latestPhoto = profileDocuments.find(
        (document) => document.document_type === 'photo',
    );
    const latestResume = profileDocuments.find(
        (document) => document.document_type === 'resume',
    );

    useEffect(() => {
        return () => {
            if (photoPreview) {
                URL.revokeObjectURL(photoPreview);
            }
        };
    }, [photoPreview]);

    if (!user) {
        return null;
    }

    return (
        <>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto bg-[#eef3ef] p-4 dark:bg-background">
                <div className="rounded-lg border border-[#cbd8cf] bg-[#f8faf7] p-4 shadow-sm shadow-[#17201b]/5 dark:border-[#33463a] dark:bg-[#16231c]">
                    <h1 className="text-xl font-semibold tracking-tight">
                        Profile
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Manage your profile and account settings.
                    </p>
                </div>

                <div className="grid gap-4 xl:grid-cols-2 xl:items-stretch">
                    <section className="rounded-lg border border-[#cbd8cf] bg-[#f8faf7] p-5 shadow-sm shadow-[#17201b]/5 sm:p-6 dark:border-[#33463a] dark:bg-[#16231c]">
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
                                    <div className="grid gap-2 sm:col-span-2">
                                        <AvatarPresetPicker
                                            className="border-y border-[#dce6df] py-4 sm:grid-cols-[minmax(180px,0.42fr)_minmax(0,1fr)] sm:items-start dark:border-[#33463a]"
                                            name="avatar_preset"
                                            value={avatarPreset}
                                            onChange={(value) => {
                                                setAvatarPreset(value);
                                                setPhotoPreview(null);

                                                if (photoInput.current) {
                                                    photoInput.current.value =
                                                        '';
                                                }
                                            }}
                                            currentAvatar={
                                                photoPreview || user.avatar
                                            }
                                            fallback={getInitials(user.name)}
                                        />

                                        <InputError
                                            message={errors.avatar_preset}
                                        />
                                    </div>

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

                                        <InputError message={errors.industry} />
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
                                            Country
                                        </Label>

                                        <LocationSelect
                                            id="location"
                                            name="location"
                                            value={location}
                                            onChange={setLocation}
                                            placeholder="Select country"
                                        />

                                        <InputError message={errors.location} />
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

                                        <DegreeSelect
                                            id="education_degree"
                                            name="education_degree"
                                            value={degree}
                                            onChange={setDegree}
                                            placeholder="Select degree"
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

                                        <div className="flex h-9 w-full items-center rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
                                            <Input
                                                id="photo"
                                                ref={photoInput}
                                                type="file"
                                                className="h-full flex-1 border-0 px-3 py-0 shadow-none focus-visible:border-transparent focus-visible:ring-0"
                                                name="photo"
                                                accept="image/*"
                                                onChange={(event) => {
                                                    const file =
                                                        event.target
                                                            .files?.[0] ?? null;
                                                    setPhotoPreview(
                                                        file
                                                            ? URL.createObjectURL(
                                                                  file,
                                                              )
                                                            : null,
                                                    );

                                                    if (file) {
                                                        setAvatarPreset('');
                                                    }
                                                }}
                                            />
                                            <Image className="mr-3 size-5 shrink-0 text-muted-foreground" />
                                        </div>

                                        {latestPhoto ? (
                                            <p className="truncate rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                                                Current: {latestPhoto.file_name}
                                            </p>
                                        ) : null}

                                        <InputError message={errors.photo} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="resume">Resume</Label>

                                        <div className="flex h-9 w-full items-center rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
                                            <Input
                                                id="resume"
                                                type="file"
                                                className="h-full flex-1 border-0 px-3 py-0 shadow-none focus-visible:border-transparent focus-visible:ring-0"
                                                name="resume"
                                                accept=".pdf,.doc,.docx"
                                            />
                                            <FileText className="mr-3 size-5 shrink-0 text-muted-foreground" />
                                        </div>

                                        {latestResume ? (
                                            <p className="truncate rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                                                Current:{' '}
                                                {latestResume.file_name}
                                            </p>
                                        ) : null}

                                        <p className="text-xs text-muted-foreground">
                                            PDF, DOC, or DOCX. Maximum 5 MB.
                                        </p>

                                        <InputError message={errors.resume} />
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

                    <div className="grid h-full gap-4">
                        <section className="rounded-lg border border-[#cbd8cf] bg-[#f8faf7] p-5 shadow-sm shadow-[#17201b]/5 sm:p-6 dark:border-[#33463a] dark:bg-[#16231c]">
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
                                className="mt-5 grid gap-4 sm:grid-cols-2"
                            >
                                {({ errors, processing }) => (
                                    <>
                                        <div className="grid gap-2 sm:col-span-2">
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
                                                message={
                                                    errors.current_password
                                                }
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

                                            <InputError
                                                message={errors.password}
                                            />
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

                                        <div className="flex items-center gap-4 sm:col-span-2">
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

                        <section className="rounded-lg border border-[#cbd8cf] bg-[#f8faf7] p-5 shadow-sm shadow-[#17201b]/5 sm:p-6 dark:border-[#33463a] dark:bg-[#16231c]">
                            <Heading
                                variant="small"
                                title="Account actions"
                                description="Manage sign out and account deletion"
                            />

                            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                <div className="flex flex-col justify-between gap-4 rounded-md border border-[#dce6df] bg-white/70 p-4 dark:border-[#33463a] dark:bg-[#213128]/50">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">
                                            Log out
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            End your current session on this
                                            device.
                                        </p>
                                    </div>

                                    <Form
                                        {...logout.form()}
                                        onSubmit={(
                                            event: FormEvent<HTMLFormElement>,
                                        ) => {
                                            if (
                                                !window.confirm(
                                                    'Log out of your account?',
                                                )
                                            ) {
                                                event.preventDefault();
                                            }
                                        }}
                                    >
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
                                </div>

                                <DeleteUser />
                            </div>
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
