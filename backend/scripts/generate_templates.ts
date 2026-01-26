import { Document, Packer, Paragraph, TextRun, Header, Footer, AlignmentType } from 'docx';
import fs from 'fs';
import path from 'path';

async function generateTemplates() {
    const templatesDir = path.join(__dirname, '../templates');
    if (!fs.existsSync(templatesDir)) {
        fs.mkdirSync(templatesDir, { recursive: true });
    }

    // --- MODE A: Letterhead on Every Page ---
    const docA = new Document({
        sections: [{
            headers: {
                default: new Header({
                    children: [new Paragraph({
                        children: [new TextRun({ text: "{COMPANY_NAME}", bold: true, size: 24 })],
                        alignment: AlignmentType.CENTER
                    })]
                })
            },
            footers: {
                default: new Footer({
                    children: [new Paragraph({
                        children: [new TextRun({ text: "Page ", size: 18 }), new TextRun({ children: ["PAGE_NUMBER"], size: 18 })],
                        alignment: AlignmentType.CENTER
                    })]
                })
            },
            children: [
                new Paragraph({ text: "{TITLE}", heading: "Heading1", alignment: AlignmentType.CENTER }),
                new Paragraph({ text: "" }),
                new Paragraph({ children: [new TextRun({ text: "{CONTENT}", size: 24 })] })
            ]
        }]
    });

    const bufferA = await Packer.toBuffer(docA);
    fs.writeFileSync(path.join(templatesDir, 'contract_mode_a.docx'), bufferA);
    console.log('✅ Generated contract_mode_a.docx');

    // --- MODE B: First Page Letterhead + Continuation ---
    // Note: Creating 'Different First Page' via docx library
    const docB = new Document({
        sections: [{
            properties: {
                titlePage: true, // This enables Different First Page
            },
            headers: {
                first: new Header({
                    children: [new Paragraph({ text: "FIRST PAGE LETTERHEAD - {COMPANY_NAME}", alignment: AlignmentType.CENTER })]
                }),
                default: new Header({
                    children: [new Paragraph({ text: "CONTINUATION SHEET", alignment: AlignmentType.CENTER })]
                })
            },
            children: [
                new Paragraph({ text: "{TITLE}", heading: "Heading1", alignment: AlignmentType.CENTER }),
                new Paragraph({ text: "" }),
                new Paragraph({ children: [new TextRun({ text: "{CONTENT}", size: 24 })] })
            ]
        }]
    });

    const bufferB = await Packer.toBuffer(docB);
    fs.writeFileSync(path.join(templatesDir, 'contract_mode_b.docx'), bufferB);
    console.log('✅ Generated contract_mode_b.docx');
}

generateTemplates().catch(console.error);
