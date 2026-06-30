export const degreeOptions = [
    'High School Diploma',
    'Associate Degree',
    'Bachelor of Arts',
    'Bachelor of Science',
    'Bachelor of Business Administration',
    'Bachelor of Engineering',
    'Bachelor of Information Technology',
    'Master of Arts',
    'Master of Science',
    'Master of Business Administration',
    'Doctorate',
    'Certificate',
    'Diploma',
    'Vocational',
];

export function getDegreeOptions(currentDegree?: string | null) {
    const current = currentDegree?.trim();

    if (!current || degreeOptions.includes(current)) {
        return degreeOptions;
    }

    return [current, ...degreeOptions];
}
