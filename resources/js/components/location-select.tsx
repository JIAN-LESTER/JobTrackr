import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { getLocationOptions } from '@/lib/location-options';

type LocationSelectProps = {
    id: string;
    value: string;
    onChange: (value: string) => void;
    name?: string;
    placeholder?: string;
};

export default function LocationSelect({
    id,
    value,
    onChange,
    name,
    placeholder = 'Select country',
}: LocationSelectProps) {
    return (
        <>
            {name ? <input type="hidden" name={name} value={value} /> : null}
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger id={id} className="w-full">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {getLocationOptions(value).map((location) => (
                        <SelectItem key={location} value={location}>
                            {location}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </>
    );
}
