import type { Application } from './Application';

export type Interview = {
    interview_id: number;
    job_application_id: number;
    interview_type: string | null;
    scheduled_at: string | null;
    location: string | null;
    meeting_link: string | null;
    status: string;
    feedback: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
    job_application?: Application;
};
