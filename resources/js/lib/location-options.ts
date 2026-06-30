export const locationOptions = [
    'Philippines',
    'United States',
    'Canada',
    'United Kingdom',
    'Australia',
    'New Zealand',
    'Singapore',
    'Malaysia',
    'Indonesia',
    'Thailand',
    'Vietnam',
    'Japan',
    'South Korea',
    'China',
    'Taiwan',
    'Hong Kong',
    'India',
    'United Arab Emirates',
    'Saudi Arabia',
    'Qatar',
    'Germany',
    'France',
    'Netherlands',
    'Spain',
    'Italy',
];

export function getLocationOptions(currentLocation?: string | null) {
    const current = currentLocation?.trim();

    if (!current || locationOptions.includes(current)) {
        return locationOptions;
    }

    return [current, ...locationOptions];
}
