# JobTrackr

JobTrackr is a personal job application tracking system designed to help users organize and monitor their job search in one place. It allows users to save job applications with key details such as company name, job title, job type, work setup, location, salary range, application status, applied date, job post link, and job description. It also includes a Google Chrome extension feature that helps import job details from online job postings into the system.

The system helps users track the progress of each application through different statuses, search and filter applications, create reminders, receive reminder notifications through email, manage interview records, store notes, contacts, and documents, and view a timeline of application updates. Each user's applications are connected to their own account, making the system suitable for private and personal job search management.

## Automated Testing

Automated tests run through GitHub Actions on pushes, pull requests, manual runs, and a daily scheduled CI run.

Local test command:

```bash
php artisan test
```

The automated suite covers authentication/settings starter flows, onboarding, application CRUD, related records, audit logs, companies, and the scheduled reminder command.
