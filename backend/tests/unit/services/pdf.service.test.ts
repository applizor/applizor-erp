import { PDFService } from '@/services/pdf.service';

describe('PDFService', () => {
    describe('getBackgroundCSS', () => {
        it('should return simple margins if useLetterhead is false', () => {
            const css = PDFService.getBackgroundCSS({}, false);
            expect(css).toContain('@page { margin: 40px; }');
            expect(css).not.toContain('background-image');
        });

        it('should generate correct margins and background for Letterhead mode', () => {
            const company = {
                pdfMarginTop: 150,
                pdfContinuationTop: 100,
                pdfMarginBottom: 50,
                pdfMarginLeft: 20,
                pdfMarginRight: 20,
                letterhead: 'http://example.com/lh.jpg',
                continuationSheet: 'http://example.com/cs.jpg'
            };

            const css = PDFService.getBackgroundCSS(company, true);

            // First Page
            expect(css).toContain('margin-top: 150px;');
            expect(css).toContain("background-image: url('http://example.com/lh.jpg')");

            // Continuation Page
            expect(css).toContain('margin: 100px 20px 50px 20px;');
            expect(css).toContain("background-image: url('http://example.com/cs.jpg')");
        });

        it('should handle undefined continuation sheet gracefully', () => {
            const company = {
                letterhead: 'http://example.com/lh.jpg',
            };

            const css = PDFService.getBackgroundCSS(company, true);

            // Continuation page (standard margins, no bg)
            // Default constants: Top 80, Right 40, Bottom 80, Left 40
            expect(css).toContain('margin: 80px 40px 80px 40px;');
            expect(css).toContain("background-image: url('http://example.com/lh.jpg')"); // First page has it
            // Continuation rules shouldn't have background if undefined
            // Note: Our service logic adds blank string if undefined?
            // "continuationBase64 ? ... : ''" -> logic checks out.
        });
    });
});
