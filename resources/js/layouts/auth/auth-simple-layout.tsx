import { cn } from '@/lib/utils';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
    side,
    sidePosition = 'left',
}: AuthLayoutProps) {
    if (side) {
        return (
            <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[#e8eee9] p-5 md:p-10 dark:bg-background">
                <div className="absolute inset-x-0 top-0 h-56 bg-[#cfdcd3] dark:bg-muted/20" />
                <div className="absolute inset-x-0 bottom-0 h-40 bg-[#dfe8e2] dark:bg-muted/10" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(23,32,27,0.09)_1px,transparent_1px),linear-gradient(to_bottom,rgba(23,32,27,0.09)_1px,transparent_1px)] bg-[size:48px_48px] dark:opacity-20" />

                <div className="relative grid w-full max-w-5xl gap-5 lg:min-h-[520px] lg:grid-cols-2 lg:items-stretch">
                    <div
                        className={cn(
                            'h-full w-full',
                            sidePosition === 'right' && 'lg:order-2',
                        )}
                    >
                        {side}
                    </div>

                    <div className="h-full w-full rounded-md border bg-background/95 p-6 shadow-2xl shadow-black/15 backdrop-blur sm:p-8">
                        <div className="flex h-full flex-col justify-center gap-6">
                            <div className="flex flex-col items-center gap-4">
                                <div className="flex flex-col items-center gap-2 font-medium">
                                    <img
                                        src="/JobTrackr-logo.png"
                                        alt="JobTrackr"
                                        className="h-20 w-auto object-contain"
                                    />
                                    <span className="sr-only">{title}</span>
                                </div>

                                <div className="space-y-2 text-center">
                                    <h1 className="text-xl font-medium">
                                        {title}
                                    </h1>
                                    <p className="text-center text-sm text-muted-foreground">
                                        {description}
                                    </p>
                                </div>
                            </div>
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex flex-col items-center gap-2 font-medium">
                            <img
                                src="/JobTrackr-logo.png"
                                alt="JobTrackr"
                                className="h-20 w-auto object-contain"
                            />
                            <span className="sr-only">{title}</span>
                        </div>

                        <div className="space-y-2 text-center">
                            <h1 className="text-xl font-medium">{title}</h1>
                            <p className="text-center text-sm text-muted-foreground">
                                {description}
                            </p>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
