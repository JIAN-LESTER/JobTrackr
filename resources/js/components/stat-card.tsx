import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

type StatCardProps = {
    title: string;
    value: number | string;
    icon: LucideIcon;
};

export function StatCard({ title, value, icon: Icon }: StatCardProps) {
    return (
        <Card className="rounded-lg py-4">
            <CardContent className="flex items-center justify-between gap-3 px-4">
                <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight">
                        {value}
                    </p>
                </div>
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Icon className="size-5" />
                </div>
            </CardContent>
        </Card>
    );
}
