---
trigger: always_on
---

# Letterhead Logic & Styling Rules

## 1. Context
Across the ERP system (Quotations, Invoices, Contracts), we use a consistent logic for letterheads. This rule ensures that all generated PDFs maintain a professional and branded appearance that matches the company's identity.

## 2. Implementation Rules

### A. Dynamic Backgrounds
- **Page 1**: Must use a specific background image (typically containing the full header, logo, and footer).
- **Continuation Pages**: Must use a simplified background (typically just a minimal header or footer) to allow for more content space.
- **Controls**: The specialized `PDFService` (backend) and `PagedRichTextEditor` (frontend) must accept `pageOneBg` and `continuationBg` parameters.

### B. PDF Margins
To accommodate the letterhead graphics without overlapping text:

| Page Type | Top Margin | Bottom Margin | Left/Right |
| :--- | :--- | :--- | :--- |
| **First Page** | `180px` (Adjustable via Company Settings) | `80px` | `40px` |
| **Continuation** | `80px` (Adjustable) | `40px` | `40px` |

*Note: These values are stored in the `Company` model (`pdfMarginTop`, `pdfContinuationTop`, etc.) and should be fetched dynamically.*

### C. Standard CSS for PDF Generation
All PDF generation templates (Puppeteer/HTML based) must include:

```css
@page {
    margin: 0; /* Important for full-bleed backgrounds */
}
body {
    /* Base padding handled by container div to simulate margins */
    font-family: 'Inter', 'Roboto', 'Arial', sans-serif;
    color: #1a1a1a;
}
.page-1-margin { paddingTop: [pdfMarginTop]px; }
.continuation-margin { paddingTop: [pdfContinuationTop]px; }
```

## 3. Usage in Code
When creating new modules that require PDF generation:
1.  **Do not hardcode styles.** Fetch spacing from `company` settings.
2.  **Use `pdf.service.ts`.** Do not create ad-hoc PDF generators. Extend `pdf.service.ts` functions (e.g., `generateDocumentPDF`).
3.  **Frontend Editor:** Always pass `showLetterhead={true}` to `PagedRichTextEditor` if the final output is meant to be on letterhead.
