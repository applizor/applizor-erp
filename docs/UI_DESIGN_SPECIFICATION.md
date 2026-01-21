# UI Design & Standardization Specification

This document outlines the visual and behavioral standards for the Applizor ERP. Adherence to these standards ensures a cohesive, professional, and premium "Enterprise High-Density" experience.

---

## 1. Core Philosophy: Enterprise High-Density
The design prioritizes information density without sacrificing readability. It is built for power users who require quick access to data and actions.
- **Micro-Typography**: Smaller font sizes combined with increased weight and tracking.
- **Tight Spacing**: Minimal but consistent padding.
- **Premium Accents**: Subtle shadows, border-radii, and a sophisticated color palette.

---

## 2. Color Palette (Applizor Petrol Blue)
The primary brand color is a deep, authoritative Petrol Blue.

- **Primary (Petrol Blue)**: `bg-primary-900` (#001C30 equivalent)
- **Secondary (Slate/Gray)**: `text-gray-500`, `bg-gray-50`
- **Surface**: `bg-white`
- **Borders**: `border-gray-200` or `border-slate-100`

---

## 3. Global Geometry
Consistency in corner treatment is critical for a "tactile" interface.

- **Standard Radius**: `rounded-md` (used for Containers, Buttons, Modals, Inputs).
- **Avoid**: `rounded-lg`, `rounded-xl`, or `rounded-full` (except for profile avatars/specific indicators).

---

## 4. Standard Page Header Component
Every main view must use the standardized header structure to ensure navigation consistency.

### Specification:
- **Container**:
    - Classes: `bg-white p-5 rounded-md border border-gray-200 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6`
- **Contextual Icon Box**:
    - Classes: `p-2.5 bg-primary-900 rounded-md shadow-lg`
    - Icon Size: `w-5 h-5 text-white`
- **Title Section**:
    - **Primary Title**: `text-lg font-black text-gray-900 tracking-tight leading-none uppercase`
    - **Subtitle Label**: `text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest leading-none`
- **Action Section**:
    - Classes: `flex items-center gap-3 w-full lg:w-auto`
    - **Search Input**: Use high-density `ent-input`.
    - **Primary CTA**: `btn-primary` with `text-[10px] font-black uppercase tracking-widest`.

---

## 5. Typography Standards
- **Headings (H1/H2)**: `text-lg` or `text-xl`, Bold/Black, Uppercase.
- **Body Copy**: `text-sm` or `text-xs`.
- **Secondary Labels**: `text-[9px]` or `text-[10px]`, `font-black`, `tracking-widest`, `uppercase`.
- **Data Tables**: `text-xs font-bold` for rows, `text-[9px] font-black uppercase tracking-widest` for headers.

---

## 6. Components Registry

### Buttons
Ensure buttons have high-density tracking:
- **Primary**: `.btn-primary` (Petrol Blue background)
- **Secondary**: `.btn-secondary` (Bordered or Light background)
- **Sizing**: Use compact padding (`px-4 py-2`).

### Forms & Inputs
- **Inputs**: Use `.ent-input` class for consistent borders and high-density text.
- **Focus State**: `focus:ring-primary-500 focus:border-primary-500`.

### Cards & Tables
- **Cards**: `.ent-card` with `p-5` or `p-6` padding.
- **Tables**: `.ent-table` using `divide-y divide-gray-100` and high-density cell padding.

---

## 7. Interactive Feedback
- **Hover Effects**: Subtle transitions for all interactive elements.
- **Skeletons**: All heavy data tables must implement `TableRowSkeleton` or module-specific skeletons.
- **Toasts**: Use `useToast` hook for contextual feedback.

---
*Last Updated: January 2026*
