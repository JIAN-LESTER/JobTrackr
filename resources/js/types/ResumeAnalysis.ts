import type { Application } from './Application';

export type ResumeAnalysisResult = {
    match_score: number;
    company_name?: string | null;
    missing_technical_skills: string[];
    relevant_skills_present: string[];
    keyword_recommendations: string[];
    experience_and_project_alignment: string[];
    weak_or_unclear_sections: string[];
    suggested_bullet_point_improvements: string[];
};

export type ResumeAnalysis = {
    resume_analysis_id: number;
    job_application_id: number;
    job_description: string;
    job_post_url: string | null;
    match_score: number;
    analysis: ResumeAnalysisResult;
    created_at: string;
    job_application?: Application;
    resume_document?: { file_name: string };
};
