import type { Application } from './Application';

export type Company = {
    company_id: number;
    name: string;
    industry: string | null;
    website: string | null;
    created_at: string;
    updated_at: string;
    applications?: Application[];
};
