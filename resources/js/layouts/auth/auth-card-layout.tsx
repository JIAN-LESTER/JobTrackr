import type { PropsWithChildren } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

export default function AuthCardLayout({
    children,
    title,
    description,
}: PropsWithChildren<{
    name?: string;
    title?: string;
    description?: string;
}>) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-[#e8eee9] p-6 dark:bg-background md:p-10">
            <div className="flex w-full max-w-md flex-col gap-6">
                <div className="flex items-center justify-center self-center">
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

                <div className="flex flex-col gap-6">
                    <Card className="rounded-xl">
                        <CardHeader className="px-10 pt-8 pb-0 text-center">
                            <CardTitle className="text-xl">{title}</CardTitle>
                            <CardDescription>{description}</CardDescription>
                        </CardHeader>
                        <CardContent className="px-10 py-8">
                            {children}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
