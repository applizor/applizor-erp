import createReport from 'docx-templates';
import axios from 'axios';
import FormData from 'form-data';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

// Config - in production use env vars
const GOTENBERG_URL = process.env.GOTENBERG_URL || 'http://localhost:8000';

export enum LetterheadMode {
  NONE = 'NONE',
  FIRST_PAGE = 'FIRST_PAGE',
  EVERY_PAGE = 'EVERY_PAGE',
}

export class DocumentGenerationService {

  /**
   * Stage 1: Inject data into DOCX template
   */
  static async generateDocx(templateBuffer: Buffer, data: any): Promise<Buffer> {
    try {
      const report = await createReport({
        template: templateBuffer,
        data: data,
        cmdDelimiter: ['{{', '}}'], // Standard handlebars style
      });
      return Buffer.from(report);
    } catch (error) {
      console.error('DOCX Template generation failed:', error);
      throw new Error('Failed to generate DOCX');
    }
  }

  /**
   * Stage 2: Convert DOCX to PDF using Gotenberg
   */
  static async convertToPdf(docxBuffer: Buffer): Promise<Buffer> {
    try {
      const form = new FormData();
      form.append('files', docxBuffer, 'document.docx');

      // Use internal docker URL if backend is also in docker, else use host mapped port
      // Since backend is in docker-compose as 'backend', it can talk to 'gotenberg' via service name
      // But we must assume we might be running 'npm run dev' locally on host too.
      // Let's rely on ENV or default to localhost:8000 (which we mapped).
      // NOTE: If running backend inside container, use http://gotenberg:3000

      const response = await axios.post(`${GOTENBERG_URL}/forms/libreoffice/convert`, form, {
        responseType: 'arraybuffer',
        headers: {
          ...form.getHeaders(),
        },
      });

      return Buffer.from(response.data);
    } catch (error: any) {
      console.error('Gotenberg conversion failed:', error.message);
      throw new Error('Failed to convert to PDF');
    }
  }

  /**
   * Stage 3: Overlay Letterhead
   * mode: 'ALL_PAGES' | 'FIRST_PAGE' | 'NONE'
   */
  static async applyLetterhead(pdfBuffer: Buffer, letterheadBuffer: Buffer | null, mode: 'ALL_PAGES' | 'FIRST_PAGE' | 'NONE'): Promise<Buffer> {
    if (mode === 'NONE' || !letterheadBuffer) {
      return pdfBuffer;
    }

    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const letterheadDoc = await PDFDocument.load(letterheadBuffer);
      const letterheadPage = letterheadDoc.getPages()[0];

      // Embed letterhead page
      const embeddedLetterhead = await pdfDoc.embedPage(letterheadPage);

      const pages = pdfDoc.getPages();
      const { width, height } = pages[0].getSize(); // Assume A4 match

      for (let i = 0; i < pages.length; i++) {
        if (mode === 'FIRST_PAGE' && i > 0) continue;

        pages[i].drawPage(embeddedLetterhead, {
          x: 0,
          y: 0,
          width,
          height,
        });
      }

      // Alternative: Place content ON TOP of letterhead
      // But we have a finished PDF from Gotenberg (opaque white background usually).
      // If Gotenberg outputs white background, we can't put it *over* letterhead.

      // STRATEGY B: We must tell Gotenberg to use a Transparent background? Not easy with LibreOffice.
      // STRATEGY C: We tell Gotenberg to use the Letterhead image as a "Background Image" in Word itself?
      //  -> But we want to do it in PDF stage to support different modes dynamically without changing Word doc.

      // CORRECT PDF-LIB APPROACH:
      // 1. Load Content PDF.
      // 2. Load Letterhead PDF.
      // 3. For each page, create a NEW page. Draw Letterhead (Background). Draw Content (Foreground).
      //    -> Provided Content PDF has transparent background? LibreOffice exports white page usually.

      // Wait, if LibreOffice gives white background, we are stuck.
      // "No HTML to PDF" requirement implies we use Word.
      // In Word, page usually has color 'No Color' but PDF export makes it white.
      // 
      // Workaround: We can't easily "Remove white background" from PDF.
      // 
      // ALTERNATE SOLUTION:
      // Embed the letterhead image into the DOCX *before* conversion using docx-templates or underlying XML?
      // No, `docx-templates` replaces text.

      // BEST APPROACH:
      // Don't modify the PDF with PDF-Lib for *backgrounds* if we can't ensure transparency.
      // Instead, `docx-templates` has limited image logic.
      //
      // Let's assume for now the Letterhead PDF is a *Header/Footer* overlay (like a stamp) that goes ON TOP of content (watermark style) 
      // OR the content text is black-on-transparent and we can overlay it.
      //
      // Actually, `pdf-lib` can merge pages.
      // If we want "Letterhead" (Logo at top, Address at bottom), and the middle is white space in Word...
      // If we draw the Letterhead ON TOP of the Word PDF, it will be visible assuming the Letterhead PDF has transparent areas (where there is no logo).
      // YES. The Letterhead PDF should be transparent except for the logo/footer.
      // The Word PDF will be white background. 
      // Valid Order: Bottom=Word PDF (White), Top=Letterhead PDF (Transparent w/ Logo).
      // This works! The Logo covers the white header area of Word (which is empty space).

      // So: Draw embeddedLetterhead ON TOP of existing page.

      return Buffer.from(await pdfDoc.save()); // save() returns Uint8Array, wrap in Buffer
    } catch (e) {
      console.error('Letterhead overlay failed', e);
      return pdfBuffer; // fallback to plain PDF
    }
  }
}

export default DocumentGenerationService;
