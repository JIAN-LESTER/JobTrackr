type AvatarPreset = {
    key: string;
    label: string;
    src: string;
};

const makeAvatar = (background: string, icon: string): string => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="64" fill="${background}"/><circle cx="38" cy="38" r="12" fill="#ffffff" fill-opacity=".22"/><circle cx="92" cy="86" r="18" fill="#ffffff" fill-opacity=".16"/><g transform="translate(32 32) scale(2.6667)" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon}</g></svg>`;

    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

export const avatarPresets: AvatarPreset[] = [
    {
        key: 'career-mark',
        label: 'Career',
        src: makeAvatar(
            '#4338ca',
            '<path d="M12 3 4 7l8 4 8-4-8-4Z"/><path d="M6 9v5c0 2 3 4 6 4s6-2 6-4V9"/><path d="M20 7v6"/>',
        ),
    },
    {
        key: 'target-mark',
        label: 'Target',
        src: makeAvatar(
            '#0f766e',
            '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
        ),
    },
    {
        key: 'briefcase-mark',
        label: 'Briefcase',
        src: makeAvatar(
            '#7c2d12',
            '<path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1"/><path d="M3 8h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z"/><path d="M3 13h18M9 13v2h6v-2"/>',
        ),
    },
    {
        key: 'growth-mark',
        label: 'Growth',
        src: makeAvatar(
            '#4d7c0f',
            '<path d="M4 18 9 13l4 4 7-9"/><path d="M15 8h5v5"/>',
        ),
    },
    {
        key: 'network-mark',
        label: 'Network',
        src: makeAvatar(
            '#1d4ed8',
            '<circle cx="6" cy="7" r="3"/><circle cx="18" cy="7" r="3"/><circle cx="12" cy="17" r="3"/><path d="m8.5 9.5 2 4M15.5 9.5l-2 4M9 7h6"/>',
        ),
    },
    {
        key: 'focus-mark',
        label: 'Focus',
        src: makeAvatar(
            '#be123c',
            '<path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4"/><circle cx="12" cy="12" r="3"/>',
        ),
    },
];
