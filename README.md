# JobTrackr

JobTrackr is a personal job-search workspace with an AI resume analyzer at its core. Compare a resume with any job description, get a practical match assessment, and turn the results into a stronger application—while keeping the rest of the job-search process organized in one place.

## AI resume analyzer

The **Resume Analyzer** compares a resume with a target job description and returns a structured review that includes:

- A 0–100 match score
- Relevant skills already present
- Missing technical skills
- Keyword recommendations
- Experience and project alignment
- Weak or unclear sections
- Suggested resume bullet-point improvements

Analyses are saved to the related application so they can be revisited alongside the job description, resume document, notes, interviews, reminders, and status history. The analyzer is designed to keep recommendations grounded in the supplied resume—it does not invent experience or skills.

The analyzer uses an OpenAI-compatible chat-completions endpoint. The default configuration targets Google’s Gemini OpenAI-compatible endpoint, but the endpoint and model can be changed through environment variables.

## What else you can do

- Track applications by company, role, location, work setup, salary range, status, and applied date
- Import job details from a browser page with the included Chrome extension
- Search and filter your application pipeline
- Manage companies, contacts, notes, interviews, documents, and status history
- Create follow-up reminders and send due-reminder emails
- Review a timeline of application activity
- Keep each user’s job-search data private to their account

## Built with

- Laravel 13 and PHP 8.4+
- React 19 with TypeScript
- Inertia.js and Vite
- PostgreSQL by default, with SQLite/MySQL support available through Laravel configuration
- Tailwind CSS and Radix UI primitives
- PHPUnit, PHPStan, Pint, ESLint, and Prettier

## Quick start

### Requirements

- PHP 8.4 or newer
- Composer
- Node.js 22 or newer and npm
- PostgreSQL, or another database supported by the configured Laravel connection

### Install

```bash
git clone <repository-url>
cd JobTrackr
composer setup
```

`composer setup` installs PHP and frontend dependencies, creates `.env` when needed, generates the application key, runs migrations, and builds the frontend assets.

Start the local development services with:

```bash
composer dev
```

The application is served at `http://localhost` by default. The development command starts the Laravel server, queue listener, log viewer, and Vite together.

## Configure the AI analyzer

Copy `.env.example` to `.env` if you have not already, then set the provider credentials and preferences:

```dotenv
RESUME_ANALYZER_API_KEY=your_api_key
RESUME_ANALYZER_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
RESUME_ANALYZER_MODEL=gemini-2.5-flash
RESUME_ANALYZER_TIMEOUT=60
RESUME_ANALYZER_CONNECT_TIMEOUT=10
RESUME_ANALYZER_DAILY_LIMIT=5
RESUME_ANALYZER_RESET_HOUR=8
RESUME_ANALYZER_COOLDOWN_MINUTES=5
```

`RESUME_ANALYZER_ENDPOINT` must accept the OpenAI chat-completions request format and return JSON content. The daily limit and cooldown help control provider usage per user. Set `RESUME_ANALYZER_API_KEY` before using the `/analyze-resume` page; without it, the application reports that analysis is not configured.

## Browser extension

The included extension lives in [`public/jobtrackr-extension`](public/jobtrackr-extension). It extracts job details from the current browser page and sends them to JobTrackr.

To load it locally in Chrome:

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select the `public/jobtrackr-extension` directory.

Set `VITE_BROWSER_EXTENSION_URL` when you want the application’s import screen to display a hosted download link for the extension.

## Useful commands

```bash
# Start the full local development environment
composer dev

# Build frontend assets
npm run build

# Run the test suite directly
php artisan test

# Run static/type checks used by CI
composer types:check
```

## Testing and CI

GitHub Actions runs frontend quality checks and the PHP test suite on pushes, pull requests, manual runs, and a scheduled daily run. The feature tests cover authentication, onboarding, application workflows, related records, reminders, audit logs, and resume analysis.

For a local test run:

```bash
php artisan test
```

## Project layout

```text
app/Services/ResumeAnalyzer.php       AI provider integration and response normalization
app/Http/Controllers/                 Application and resume-analysis request handling
resources/js/pages/AnalyzeResume.tsx  Resume analyzer interface
public/jobtrackr-extension/           Chrome extension source
database/migrations/                  Applications, documents, and saved analyses
routes/web.php                        Authenticated web routes
tests/Feature/ResumeAnalysisTest.php  Resume analyzer workflow coverage
```

## License

This project is licensed under the MIT License.
