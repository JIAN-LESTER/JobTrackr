<?php

return [
    'resume_analyzer' => [
        'api_key' => env('RESUME_ANALYZER_API_KEY'),
        'endpoint' => env('RESUME_ANALYZER_ENDPOINT', 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'),
        'model' => env('RESUME_ANALYZER_MODEL', 'gemini-2.5-flash'),
        'timeout' => (int) env('RESUME_ANALYZER_TIMEOUT', 60),
        'connect_timeout' => (int) env('RESUME_ANALYZER_CONNECT_TIMEOUT', 10),
        'daily_limit' => (int) env('RESUME_ANALYZER_DAILY_LIMIT', 5),
        'reset_hour' => (int) env('RESUME_ANALYZER_RESET_HOUR', 8),
        'cooldown_minutes' => (int) env('RESUME_ANALYZER_COOLDOWN_MINUTES', 5),
    ],
];
