<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail as BaseVerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;

class VerifyEmail extends BaseVerifyEmail
{
    protected function verificationUrl($notifiable): string
    {
        $path = URL::temporarySignedRoute(
            'verification.verify',
            Carbon::now()->addMinutes(Config::get('auth.verification.expire', 60)),
            [
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ],
            false,
        );

        return rtrim((string) config('app.url'), '/').$path;
    }

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
