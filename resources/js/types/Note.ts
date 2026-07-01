import type { Application } from './Application';
import type { User } from './User';

export type Note = {
    note_id: number;
    job_application_id: number;
    user_id: number;
    content: string;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
    job_application?: Application;
    user?: User;
};
