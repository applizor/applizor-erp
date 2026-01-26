import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';

const GOTENBERG_URL = process.env.GOTENBERG_URL || 'http://gotenberg:3000';

export class DocumentEngine {
    /**
     * Populate a DOCX template with data and convert to PDF
     */
    static async generatePDF(templateName: string, data: any): Promise<Buffer> {
        let templatePath = path.join(process.cwd(), 'templates', templateName);

        if (!fs.existsSync(templatePath)) {
            // Check in backend/templates if running from project root
            const altPath = path.join(process.cwd(), 'backend', 'templates', templateName);
            if (fs.existsSync(altPath)) {
                templatePath = altPath;
            } else {
                throw new Error(`Template not found at ${templatePath} or ${altPath}`);
            }
        }

        const content = fs.readFileSync(templatePath, 'binary');
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        // Populate template
        doc.render(data);

        const buf = doc.getZip().generate({
            type: 'nodebuffer',
            compression: 'DEFLATE',
        });

        // Convert DOCX buffer to PDF using Gotenberg (LibreOffice Engine)
        try {
            const formData = new FormData();
            formData.append('files', buf, {
                filename: 'document.docx',
                contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            });

            const response = await axios.post(
                `${GOTENBERG_URL}/forms/libreoffice/convert`,
                formData,
                {
                    headers: formData.getHeaders(),
                    responseType: 'arraybuffer',
                    timeout: 60000 // DOCX conversion can be slow
                }
            );

            return Buffer.from(response.data);
        } catch (error: any) {
            console.error('Gotenberg DOCX conversion failed:', error.message);
            throw new Error(`Failed to convert document to PDF via Gotenberg: ${error.message}`);
        }
    }

    /**
     * Special generator for Contracts that handles Letterhead Modes
     */
    static async generateContractPDF(contractData: any, mode: 'MODE_A' | 'MODE_B' = 'MODE_A'): Promise<Buffer> {
        // We select the base template based on the mode
        const templateName = mode === 'MODE_A' ? 'contract_mode_a.docx' : 'contract_mode_b.docx';

        // Ensure templates exist, or fallback to a default
        // In a real scenario, we might want to check if the specific template exists

        return await this.generatePDF(templateName, contractData);
    }
}
