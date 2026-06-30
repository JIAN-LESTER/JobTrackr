<?php

namespace App\Support;

class AvatarPresets
{
    public const KEYS = [
        'career-mark',
        'target-mark',
        'briefcase-mark',
        'growth-mark',
        'network-mark',
        'focus-mark',
    ];

    public static function keys(): array
    {
        return self::KEYS;
    }

    public static function url(?string $key): ?string
    {
        if (! in_array($key, self::KEYS, true)) {
            return null;
        }

        [$background, $foreground, $text] = match ($key) {
            'target-mark' => ['#0f766e', '#ffffff', 'TG'],
            'briefcase-mark' => ['#7c2d12', '#ffffff', 'BR'],
            'growth-mark' => ['#4d7c0f', '#ffffff', 'GR'],
            'network-mark' => ['#1d4ed8', '#ffffff', 'NW'],
            'focus-mark' => ['#be123c', '#ffffff', 'FC'],
            default => ['#4338ca', '#ffffff', 'JT'],
        };

        $svg = <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="64" fill="{$background}"/><circle cx="38" cy="38" r="12" fill="{$foreground}" fill-opacity=".22"/><circle cx="92" cy="86" r="18" fill="{$foreground}" fill-opacity=".16"/><text x="64" y="75" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="{$foreground}">{$text}</text></svg>
SVG;

        return 'data:image/svg+xml,' . rawurlencode($svg);
    }
}
