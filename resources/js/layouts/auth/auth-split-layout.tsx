import { usePage } from '@inertiajs/react';
import type { AuthLayoutProps } from '@/types';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props;

    return (
        <div className="relative grid h-dvh flex-col items-center justify-center bg-[#e8eee9] px-8 dark:bg-background sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
                <div className="absolute inset-0 bg-zinc-900" />
                <div className="relative z-20 flex items-center text-lg font-medium">
                    <img
                        src="/JobTrackr-logo.png"
                        alt="JobTrackr"
                        className="mr-3 h-14 w-auto object-contain dark:hidden"
                    />
                    <img
                        src="/JobTrackr-logo-white.png"
                        alt="JobTrackr"
                        className="mr-3 hidden h-14 w-auto object-contain dark:block"
                    />
                    {name}
                </div>
            </div>
            <div className="w-full lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <div className="relative z-20 flex items-center justify-center lg:hidden">
                        <img
                            src="/JobTrackr-logo.png"
                            alt="JobTrackr"
                            className="h-20 w-auto object-contain dark:hidden"
                        />
                        <img
                            src="/JobTrackr-logo-white.png"
                            alt="JobTrackr"
                            className="hidden h-20 w-auto object-contain dark:block"
                        />
                    </div>
                    <div className="flex flex-col items-start gap-2 text-left sm:items-center sm:text-center">
                        <h1 className="text-xl font-medium">{title}</h1>
                        <p className="text-sm text-balance text-muted-foreground">
                            {description}
                        </p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
