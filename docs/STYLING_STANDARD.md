# Applizor ERP Styling Standard

This document defines the **single source of truth** for all visual elements in the Applizor ERP "Enterprise High-Density" design system.

## 1. Core Philosophy: Enterprise High-Density

*   **Compact**: Data is dense. Avoid excessive white space.
*   **Tactile**: Use subtle borders (`border-slate-100`) and shadows (`shadow-sm`) to define areas.
*   **Contrast**: Use `slate-500` for labels (uppercase, bold) and `slate-900` for data (bold).
*   **Brand**: All primary actions use **Petrol Blue** (`bg-primary-600`).

## 2. Layout & Spacing

*   **Page Container**: Standard padding is `p-4` or `p-6` on desktop.
*   **Gap Standard**:
    *   `gap-4` between major sections.
    *   `gap-2` between related form elements.
*   **Radius**: Always use `rounded-md` (0.375rem). **NEVER** use `rounded-xl` or `rounded-2xl` for standard elements.

## 3. Component Standards

### Page Header
Every page **MUST** use the standard header pattern:
*   **Icon Box**: `w-10 h-10` or `p-2.5` container with `bg-primary-900` and white icon.
*   **Title**: `text-lg font-black uppercase text-gray-900`.
*   **Subtitle**: `text-[10px] text-gray-500 font-bold uppercase tracking-widest`.
*   **Action Area**: Right-aligned buttons and search.

### Buttons
Do not use raw Tailwind classes for buttons. Use the global utility classes or the `Button` component:
*   **Primary**: `.btn-primary` (Petrol blue, uppercase, tracking-wide).
*   **Secondary**: `.btn-secondary` (White, bordered).
*   **Danger**: `.ent-button-danger` (White, red border).

### Forms & Inputs
*   **Inputs**: Must use `.ent-input`.
*   **Labels**: Must use `.ent-label` (Uppercase, `text-[9px]`, `text-slate-400`).
*   **Groups**: Wrap label and input in `.ent-form-group`.

### Cards
*   **Container**: Use `.ent-card`.
*   **Padding**: Standard internal padding is `p-5`.

### Tables
*   **Class**: `.ent-table`.
*   **Headers**: `text-[9px] font-black uppercase tracking-[0.15em]`.
*   **Rows**: `text-[11px] font-bold`.

## 4. Typography Map

| Element | Class | Size/Weight |
| :--- | :--- | :--- |
| **Page Title** | `text-lg font-black uppercase` | 18px (Heavy) |
| **Section Title** | `text-sm font-black uppercase` | 14px (Heavy) |
| **Body / Data** | `text-xs font-bold` | 12px (Bold) |
| **Labels** | `text-[9px] font-black uppercase` | 9px (Heavy) |
| **Descriptions** | `text-[10px] text-slate-500` | 10px (Regular) |

## 5. Sidebar
*   **Width**: Standard `w-64`.
*   **Collapsed**: `w-16` (to be implemented).
*   **Active State**: `bg-primary-600 text-white`.
*   **Inactive State**: `text-slate-400 hover:text-white`.
