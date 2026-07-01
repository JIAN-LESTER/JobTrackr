import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { getDegreeOptions } from '@/lib/degree-options';

type DegreeSelectProps = {
    id: string;
    value: string;
    onChange: (value: string) => void;
    name?: string;
    placeholder?: string;
};

export default function DegreeSelect({
    id,
    value,
    onChange,
    name,
    placeholder = 'Select degree',
}: DegreeSelectProps) {
    return (
        <>
            {name ? <input type="hidden" name={name} value={value} /> : null}
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger id={id} className="w-full">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {getDegreeOptions(value).map((degree) => (
                        <SelectItem key={degree} value={degree}>
                            {degree}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </>
    );
}
