import type { Application } from './Application';

export type Reminder = {
    reminder_id: number;
    job_application_id: number;
    title: string;
    description: string | null;
    remind_at: string;
    email_sent_at: string | null;
    is_completed: boolean;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
    job_application?: Application;
};
