import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { avatarPresets } from '@/lib/avatar-presets';
import { cn } from '@/lib/utils';

type AvatarPresetPickerProps = {
    value: string;
    onChange: (value: string) => void;
    currentAvatar?: string | null;
    fallback: string;
    name?: string;
};

export default function AvatarPresetPicker({
    value,
    onChange,
    currentAvatar,
    fallback,
    name,
}: AvatarPresetPickerProps) {
    const selectedPreset = avatarPresets.find((preset) => preset.key === value);
    const preview = selectedPreset?.src || currentAvatar || undefined;

    return (
        <div className="grid gap-3">
            {name ? <input type="hidden" name={name} value={value} /> : null}

            <div className="flex items-center gap-4">
                <Avatar className="size-16 border">
                    <AvatarImage src={preview} alt="Profile avatar" />
                    <AvatarFallback>{fallback}</AvatarFallback>
                </Avatar>
                <div className="grid gap-1">
                    <p className="text-sm font-medium">Avatar</p>
                    <p className="text-xs text-muted-foreground">
                        Pick a logo or upload a picture.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                {avatarPresets.map((preset) => (
                    <button
                        key={preset.key}
                        type="button"
                        onClick={() => onChange(preset.key)}
                        className={cn(
                            'grid justify-items-center gap-2 rounded-md border p-2 text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-foreground',
                            value === preset.key &&
                                'border-primary bg-primary/10 text-foreground',
                        )}
                        aria-pressed={value === preset.key}
                    >
                        <img
                            src={preset.src}
                            alt=""
                            className="size-10 rounded-full"
                        />
                        <span>{preset.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
