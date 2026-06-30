<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail as BaseVerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;

class VerifyEmail extends BaseVerifyEmail
{
    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Verify your JobTrackr email')
            ->greeting('Welcome to JobTrackr')
            ->line('Confirm this email address to finish securing your JobTrackr account.')
            ->action('Verify email address', $this->verificationUrl($notifiable))
            ->line('If you did not create a JobTrackr account, no action is needed.');
    }
}
