import prisma from '../prisma/client';

export class RecruitmentService {
    /**
     * Mock AI Resume Parsing
     * Extracts skills, experience, and education from a mock file path.
     */
    static async parseResume(candidateId: string) {
        const candidate = await prisma.candidate.findUnique({
            where: { id: candidateId }
        });

        if (!candidate) throw new Error('Candidate not found');

        // Simulated AI Parsing Logic
        const mockSkills = ['React', 'Node.js', 'Typescript', 'PostgreSQL', 'AWS'];
        const mockExperience = '5 years of full-stack development';
        const mockEducation = 'B.Tech in Computer Science';

        const parsedData = {
            skills: mockSkills,
            experience: mockExperience,
            education: mockEducation,
            parsingConfidence: 0.95,
            parsedAt: new Date()
        };

        const updated = await prisma.candidate.update({
            where: { id: candidateId },
            data: {
                parsedData,
                tags: { set: ['ai-parsed', 'top-tech'] }
            }
        });

        return updated;
    }

    /**
     * Smart Match Engine (AI Scoring)
     * Scores a candidate against a job's requirements.
     */
    static async getMatchScore(candidateId: string, jobOpeningId: string) {
        const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
        const job = await prisma.jobOpening.findUnique({ where: { id: jobOpeningId } });

        if (!candidate || !job) throw new Error('Candidate or Job not found');

        const candidateSkills = (candidate.parsedData as any)?.skills || [];
        const jobRequirements = job.requirements ? job.requirements.toLowerCase() : '';

        let matchCount = 0;
        candidateSkills.forEach((skill: string) => {
            if (jobRequirements.includes(skill.toLowerCase())) {
                matchCount++;
            }
        });

        const score = candidateSkills.length > 0 ? (matchCount / candidateSkills.length) * 100 : 0;

        return {
            score: Math.round(score),
            matches: candidateSkills.filter((s: string) => jobRequirements.includes(s.toLowerCase())),
            missing: candidateSkills.filter((s: string) => !jobRequirements.includes(s.toLowerCase()))
        };
    }

    /**
     * Generate Public Job ID
     */
    static generatePublicId(title: string) {
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const random = Math.floor(1000 + Math.random() * 9000);
        return `${slug}-${random}`;
    }
}
