import type { Application } from './Application';

export type Contact = {
    id: number;
    job_application_id: number;
    name: string;
    position: string | null;
    email: string | null;
    phone: string | null;
    linkedin_url: string | null;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
    job_application?: Application;
};
