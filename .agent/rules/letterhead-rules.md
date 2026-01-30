---
trigger: always_on
---

# Letterhead & Continuation Sheet Logic

This document defines the standard logic for applying letterheads across all modules (Quotations, Invoices, Contracts, and Documents).

## 1. Core Concept
Every generated document must support a two-stage brand application:
- **Page 1**: Full branding (Logo, Header, Footer).
- **Continuation Pages (2+)**: Minimal branding (typically just a small header or footer) to maximize content space.

## 2. Dynamic Settings
All logic must fetch dimensions and assets from the `Company` model:
- `letterhead`: Page 1 Background (Image or PDF).
- `continuationSheet`: Page 2+ Background (Image or PDF).
- `pdfMarginTop`: Top margin for Page 1.
- `pdfContinuationTop`: Top margin for Pages 2+.
- `pdfMarginBottom`/`Left`/`Right`: Standard margins.

## 3. Implementation Flow

### Flow A: HTML to PDF (Images)
When the branding assets are images, the system uses CSS `@page` rules:
```css
@page {
    margin: [pdfContinuationTop]px [marginRight]px [marginBottom]px [marginLeft]px;
    background-image: url('[continuationSheet]');
}
@page:first {
    margin-top: [pdfMarginTop]px;
    background-image: url('[letterhead]');
}
```

### Flow B: PDF Overlay (PDFs)
When branding assets are PDFs, the system uses the `overlayBackdrop` service:
1. Generate the content PDF with whitespace margins.
2. Load the Content PDF using `pdf-lib`.
3. Loop through pages:
   - If `page === 1`: Overlay `letterhead.pdf`.
   - If `page > 1`: Overlay `continuationSheet.pdf`.
4. Merge and save.

## 4. Usage in Modules
- **Quotation/Invoice**: Uses `PDFService.generateQuotationPDF`.
- **Contract**: Uses `PDFService.generateContractPDF`.
- **Document**: MUST use `PDFService.generateGenericPDF` with the logic above injected.
