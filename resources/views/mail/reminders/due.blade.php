@component('mail::message')
# {{ $reminder->jobApplication->company->name }}

{{ $reminder->title }}

Your reminder is due for {{ $reminder->jobApplication->job_title }}.

@if ($reminder->description)
{{ $reminder->description }}
@endif

Scheduled for: {{ $reminder->remind_at->timezone(config('app.timezone'))->format('M j, Y g:i A') }}

@component('mail::button', ['url' => route('reminders.index')])
View reminders
@endcomponent

Thanks,<br>
{{ config('app.name') }}
@endcomponent
