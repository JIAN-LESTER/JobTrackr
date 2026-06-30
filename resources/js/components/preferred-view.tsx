import { Grid2X2, List, Table2 } from 'lucide-react';
import { useEffect, useState  } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type PreferredViewMode = 'card' | 'list' | 'table';

type PreferredViewColumn<T> = {
    key: string;
    label: string;
    className?: string;
    render: (item: T) => ReactNode;
};

type PreferredViewProps<T> = {
    items: T[];
    columns: PreferredViewColumn<T>[];
    emptyState: ReactNode;
    getKey: (item: T) => string | number;
    renderCard: (item: T) => ReactNode;
    renderListItem: (item: T) => ReactNode;
    onItemClick?: (item: T) => void;
    storageKey: string;
};

const viewOptions: {
    value: PreferredViewMode;
    label: string;
    icon: typeof Grid2X2;
}[] = [
    { value: 'card', label: 'Card view', icon: Grid2X2 },
    { value: 'list', label: 'List view', icon: List },
    { value: 'table', label: 'Table view', icon: Table2 },
];

export function PreferredView<T>({
    items,
    columns,
    emptyState,
    getKey,
    renderCard,
    renderListItem,
    onItemClick,
    storageKey,
}: PreferredViewProps<T>) {
    const [viewMode, setViewMode] = useState<PreferredViewMode>('card');

    useEffect(() => {
        const storedViewMode = window.localStorage.getItem(storageKey);

        if (
            storedViewMode === 'card' ||
            storedViewMode === 'list' ||
            storedViewMode === 'table'
        ) {
            setViewMode(storedViewMode);
        }
    }, [storageKey]);

    const updateViewMode = (nextViewMode: PreferredViewMode) => {
        setViewMode(nextViewMode);
        window.localStorage.setItem(storageKey, nextViewMode);
    };

    const handleItemKeyDown = (
        item: T,
        event: KeyboardEvent<HTMLElement>,
    ) => {
        if (!onItemClick) {
            return;
        }

        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onItemClick(item);
        }
    };

    return (
        <section className="space-y-4">
            <div className="flex justify-end">
                <div className="inline-flex rounded-lg border bg-background p-1">
                    {viewOptions.map((option) => {
                        const Icon = option.icon;

                        return (
                            <Button
                                key={option.value}
                                type="button"
                                variant={
                                    viewMode === option.value
                                        ? 'secondary'
                                        : 'ghost'
                                }
                                size="icon"
                                className="size-8"
                                aria-label={option.label}
                                aria-pressed={viewMode === option.value}
                                title={option.label}
                                onClick={() => updateViewMode(option.value)}
                            >
                                <Icon className="size-4" />
                            </Button>
                        );
                    })}
                </div>
            </div>

            {items.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                    {emptyState}
                </div>
            ) : null}

            {items.length > 0 && viewMode === 'card' ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {items.map((item) => (
                        <article
                            key={getKey(item)}
                            role={onItemClick ? 'button' : undefined}
                            tabIndex={onItemClick ? 0 : undefined}
                            className={cn(
                                'rounded-lg border bg-card p-4 text-card-foreground shadow-sm',
                                onItemClick
                                    ? 'cursor-pointer transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50'
                                    : '',
                            )}
                            onClick={
                                onItemClick
                                    ? () => onItemClick(item)
                                    : undefined
                            }
                            onKeyDown={(event) =>
                                handleItemKeyDown(item, event)
                            }
                        >
                            {renderCard(item)}
                        </article>
                    ))}
                </div>
            ) : null}

            {items.length > 0 && viewMode === 'list' ? (
                <div className="divide-y rounded-lg border bg-card">
                    {items.map((item) => (
                        <div
                            key={getKey(item)}
                            role={onItemClick ? 'button' : undefined}
                            tabIndex={onItemClick ? 0 : undefined}
                            className={cn(
                                'p-4',
                                onItemClick
                                    ? 'cursor-pointer transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50'
                                    : '',
                            )}
                            onClick={
                                onItemClick
                                    ? () => onItemClick(item)
                                    : undefined
                            }
                            onKeyDown={(event) =>
                                handleItemKeyDown(item, event)
                            }
                        >
                            {renderListItem(item)}
                        </div>
                    ))}
                </div>
            ) : null}

            {items.length > 0 && viewMode === 'table' ? (
                <div className="overflow-hidden rounded-lg border bg-card">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                                <tr>
                                    {columns.map((column) => (
                                        <th
                                            key={column.key}
                                            scope="col"
                                            className={cn(
                                                'px-4 py-3 font-medium',
                                                column.className,
                                            )}
                                        >
                                            {column.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {items.map((item) => (
                                    <tr
                                        key={getKey(item)}
                                        role={
                                            onItemClick ? 'button' : undefined
                                        }
                                        tabIndex={onItemClick ? 0 : undefined}
                                        className={cn(
                                            onItemClick
                                                ? 'cursor-pointer transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50'
                                                : '',
                                        )}
                                        onClick={
                                            onItemClick
                                                ? () => onItemClick(item)
                                                : undefined
                                        }
                                        onKeyDown={(event) =>
                                            handleItemKeyDown(item, event)
                                        }
                                    >
                                        {columns.map((column) => (
                                            <td
                                                key={column.key}
                                                className={cn(
                                                    'px-4 py-3 align-top',
                                                    column.className,
                                                )}
                                            >
                                                {column.render(item)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : null}
        </section>
    );
}
