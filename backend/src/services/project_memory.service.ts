import prisma from '../prisma/client';
import fs from 'fs';
import path from 'path';

export class ProjectMemoryService {
    /**
     * Main entry point to build memory for a project.
     * Scans the project and saves the result to the ERP.
     */
    static async buildProjectMemory(projectId: string, projectRootPath: string) {
        try {
            console.log(`Building Project Memory for Project: ${projectId}...`);

            // 1. Scan Project Structure
            const structure = this.scanRepository(projectRootPath);

            // 2. Scan Database Schema
            const dbSchema = this.scanDatabaseSchema(projectRootPath);

            // 3. Scan APIs (Routes)
            const apiEndpoints = this.scanAPIs(projectRootPath);

            // 4. Analyze Architecture
            const architecture = this.analyzeArchitecture(structure, apiEndpoints);

            // 5. Combine into a Memory Object
            const projectMemory = {
                structure,
                dbSchema,
                apiEndpoints,
                architecture,
                lastUpdated: new Date(),
                version: '1.0'
            };

            // 6. Store in ERP (assuming project_memory table exists as per Phase 1 requirements)
            await prisma.projectMemory.upsert({
                where: { projectId },
                update: { 
                    content: JSON.stringify(projectMemory),
                    updatedAt: new Date() 
                },
                create: { 
                    projectId, 
                    content: JSON.stringify(projectMemory),
                    createdAt: new Date(),
                    updatedAt: new Date() 
                }
            });

            return {
                success: true,
                message: 'Project memory built and stored successfully in ERP.'
            };
        } catch (error: any) {
            console.error(`Project Memory Builder Error: ${error}`);
            return {
                success: false,
                error: error.message || 'Failed to build project memory'
            };
        }
    }

    private static scanRepository(rootPath: string): string[] {
        const files: string[] = [];
        const scan = (dir: string) => {
            const list = fs.readdirSync(dir);
            list.forEach(file => {
                const fullPath = path.join(dir, file);
                if (fs.statSync(fullPath).isDirectory()) {
                    if (file !== 'node_modules' && file !== '.git') {
                        scan(fullPath);
                    }
                } else {
                    files.push(path.relative(rootPath, fullPath));
                }
            });
        };
        scan(rootPath);
        return files;
    }

    private static scanDatabaseSchema(rootPath: string): string {
        try {
            const schemaPath = path.join(rootPath, 'prisma', 'schema.prisma');
            if (fs.existsSync(schemaPath)) {
                return fs.readFileSync(schemaPath, 'utf8');
            }
            return 'Schema not found';
        } catch (e) {
            return `Error reading schema: ${e}`;
        }
    }

    private static scanAPIs(rootPath: string): string[] {
        const endpoints: string[] = [];
        const routesPath = path.join(rootPath, 'src', 'routes');

        if (fs.existsSync(routesPath)) {
            const files = fs.readdirSync(routesPath).filter(f => f.endsWith('.ts') || f.endsWith('.js'));
            files.forEach(file => {
                const content = fs.readFileSync(path.join(routesPath, file), 'utf8');
                // Simple regex to find route definitions like router.get('/path', ...)
                const matches = content.match(/\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/g);
                if (matches) {
                    matches.forEach(m => endpoints.push(`${file}: ${m}`));
                }
            });
        }
        return endpoints;
    }

    private static analyzeArchitecture(structure: string[], apiEndpoints: string[]): string {
        const hasControllers = structure.some(f => f.includes('controllers'));
        const hasServices = structure.some(f => f.includes('services'));
        const hasPrisma = structure.some(f => f.includes('prisma'));

        let pattern = 'Unknown';
        if (hasControllers && hasServices && hasPrisma) {
            pattern = 'Controller -> Service -> Prisma (Standard Layered Architecture)';
        } else if (hasControllers && hasPrisma) {
            pattern = 'Controller -> Prisma (Simple Architecture)';
        }

        return `Pattern: ${pattern}. Total Endpoints Found: ${apiEndpoints.length}`;
    }
}
