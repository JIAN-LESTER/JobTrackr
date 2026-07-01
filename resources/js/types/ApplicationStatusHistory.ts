import type { Application } from './Application';

export type ApplicationStatusHistory = {
    id: number;
    job_application_id: number;
    old_status: string | null;
    new_status: string;
    remarks: string | null;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
    job_application?: Application;
};
