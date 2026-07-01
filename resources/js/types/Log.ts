import type { User } from './User';

export type Log = {
    log_id: number;
    user_id: number;
    action: string;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
    user?: User;
};
