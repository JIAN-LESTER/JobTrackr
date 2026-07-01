export type User = {
    user_id: number;
    name: string;
    email: string;
    industry: string | null;
    job_title: string | null;
    location: string | null;
    education_school: string | null;
    education_degree: string | null;
    education_program: string | null;
    avatar_preset: string | null;
    avatar?: string | null;
    onboarding_completed_at: string | null;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
};
