import { Moon, Sun } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

export default function AppearanceToggleTab({
    className = '',
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    const { appearance, updateAppearance } = useAppearance();
    const nextAppearance = appearance === 'dark' ? 'light' : 'dark';
    const Icon = appearance === 'dark' ? Sun : Moon;
    const label = `Use ${nextAppearance} theme`;

    return (
        <button
            {...props}
            type="button"
            aria-label={label}
            title={label}
            onClick={() => updateAppearance(nextAppearance)}
            className={cn(
                'inline-flex size-9 items-center justify-center text-[#17201b] transition-colors hover:text-[#2f6f4f] focus-visible:ring-2 focus-visible:ring-[#2f6f4f] focus-visible:ring-offset-2 focus-visible:outline-none dark:text-[#f4f8f2] dark:hover:text-[#f3c76a] dark:focus-visible:ring-[#f3c76a] dark:focus-visible:ring-offset-[#0f1713]',
                className,
            )}
        >
            <Icon className="h-5 w-5" />
        </button>
    );
}
