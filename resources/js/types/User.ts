export type User = {
    user_id: number;
    name: string;
    email: string;
    job_title: string | null;
    location: string | null;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
};
