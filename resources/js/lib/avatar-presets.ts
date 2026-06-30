type AvatarPreset = {
    key: string;
    label: string;
    src: string;
};

const makeAvatar = (background: string, text: string): string => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="64" fill="${background}"/><circle cx="38" cy="38" r="12" fill="#ffffff" fill-opacity=".22"/><circle cx="92" cy="86" r="18" fill="#ffffff" fill-opacity=".16"/><text x="64" y="75" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#ffffff">${text}</text></svg>`;

    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

export const avatarPresets: AvatarPreset[] = [
    {
        key: 'career-mark',
        label: 'Career',
        src: makeAvatar('#4338ca', 'JT'),
    },
    {
        key: 'target-mark',
        label: 'Target',
        src: makeAvatar('#0f766e', 'TG'),
    },
    {
        key: 'briefcase-mark',
        label: 'Briefcase',
        src: makeAvatar('#7c2d12', 'BR'),
    },
    {
        key: 'growth-mark',
        label: 'Growth',
        src: makeAvatar('#4d7c0f', 'GR'),
    },
    {
        key: 'network-mark',
        label: 'Network',
        src: makeAvatar('#1d4ed8', 'NW'),
    },
    {
        key: 'focus-mark',
        label: 'Focus',
        src: makeAvatar('#be123c', 'FC'),
    },
];
