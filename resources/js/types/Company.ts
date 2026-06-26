import type { Application } from './Application';

export type Company = {
    company_id: number;
    name: string;
    industry: string | null;
    website: string | null;
    url: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    created_at: string;
    updated_at: string;
    applications?: Application[];
};
