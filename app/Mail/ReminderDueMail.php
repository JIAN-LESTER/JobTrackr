<?php

namespace App\Mail;

use App\Models\Reminder;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
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
        return new Envelope(
            subject: 'Reminder: '.$this->reminder->title,
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.reminders.due',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
