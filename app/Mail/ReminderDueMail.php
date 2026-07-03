<?php

namespace App\Mail;

use App\Models\Application;
use App\Models\Reminder;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ReminderDueMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Reminder $reminder)
    {
        $this->reminder->loadMissing('jobApplication.company');
    }

    public function envelope(): Envelope
    {
        /** @var Application $application */
        $application = $this->reminder->jobApplication;

        return new Envelope(
            subject: $application->company->name,
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.reminders.due',
        );
    }

    /** @return array<int, Attachment> */
    public function attachments(): array
    {
        return [];
    }
}
