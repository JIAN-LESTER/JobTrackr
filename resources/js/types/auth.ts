export type User = {
    user_id: number;
    id: number;
    name: string;
    email: string;
    industry?: string | null;
    job_title?: string | null;
    location?: string | null;
    education_school?: string | null;
    education_degree?: string | null;
    education_program?: string | null;
    onboarding_completed_at?: string | null;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};

/* @chisel-passkeys */
export type Passkey = {
    id: number;
    name: string;
    authenticator: string | null;
    created_at_diff: string;
    last_used_at_diff: string | null;
};
/* @end-chisel-passkeys */
