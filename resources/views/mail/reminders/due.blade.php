@component('mail::message')
# {{ $reminder->title }}

Your reminder is due for {{ $reminder->jobApplication->job_title }} at {{ $reminder->jobApplication->company->name }}.

@if ($reminder->description)
{{ $reminder->description }}
@endif

Scheduled for: {{ $reminder->remind_at->format('M j, Y g:i A') }}

@component('mail::button', ['url' => route('reminders.index')])
View reminders
@endcomponent

Thanks,<br>
{{ config('app.name') }}
@endcomponent
