export declare class DocumentGenerationService {
    /**
     * Stage 1: Inject data into DOCX template
     */
    static generateDocx(templateBuffer: Buffer, data: any): Promise<Buffer>;
    /**
     * Stage 2: Convert DOCX to PDF using Gotenberg
     */
    static convertToPdf(docxBuffer: Buffer): Promise<Buffer>;
    /**
     * Stage 3: Overlay Letterhead
     * mode: 'ALL_PAGES' | 'FIRST_PAGE' | 'NONE'
     */
    static applyLetterhead(pdfBuffer: Buffer, letterheadBuffer: Buffer | null, mode: 'ALL_PAGES' | 'FIRST_PAGE' | 'NONE'): Promise<Buffer>;
}
//# sourceMappingURL=document.service.d.ts.map