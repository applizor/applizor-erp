---
trigger: always_on
---

# Applizor ERP Development Rulebook

This document outlines the mandatory development standards and rules for the Applizor ERP project. All contributors must adhere to these guidelines.

## UI & UX Standards

### 1. No Browser Native Dialogs
- **Rule**: Never use `window.alert()`, `window.confirm()`, or `window.prompt()`.
- **Reason**: These native dialogs interrupt the user experience and do not match the premium aesthetics of the application.
- **Alternative**: Use custom modals, toast notifications (using `useToast`), or inline feedback components.

### 2. Premium Aesthetics
- **Rule**: Always prioritize visual excellence. Use vibrant colors, sleek dark modes (if applicable), and modern typography.
- **Rule**: Avoid generic colors (plain red, blue, green). Use curated palettes.
- **Rule**: Implement smooth micro-animations and transitions to make the interface feel alive.

### 3. Data Integrity & Sync
- **Rule**: MANDATORY BACKUP: Before running ANY database migration (`prisma migrate`), you MUST update the `docs/MIGRATION_RULES.md` and follow the backup procedure.
- **Rule**: Ensure seamless data synchronization between modules (e.g., Lead to Client conversion). All captured data must be preserved.
- **Rule**: Use Zod for strict schema validation on both frontend and backend.

### 4. No Placeholders
- **Rule**: Do not use placeholder images or text. Generate realistic assets using the provided tools.

## Backend Standards

### 1. Strong Typing
- **Rule**: Maintain full TypeScript type safety across the board.
- **Rule**: Regenerate Prisma client after any schema change.

### 2. Permissions
- **Rule**: Always check permissions using `PermissionService` before a backend action.


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

# UI Rules & Permission Standards

## 1. UI Standards

### A. Buttons & Actions
- **Primary Actions (Save, Create, Send)**: Use `btn-primary` class.
    - *Example*: `<button className="btn-primary"><Save size={14} /> Save</button>`
- **Secondary Actions (Cancel, Back)**: Use `ent-button-secondary`.
    - *Example*: `<Link href="..." className="ent-button-secondary">Back</Link>`
- **Destructive Actions (Delete)**: Use red/rose color schemes with confirmation dialogs.

### B. Forms
- **Layout**: Use `ent-card` for container.
- **Grid**: Use `grid-cols-1 md:grid-cols-12` standard.
- **Inputs**: Use `ent-input` and `ent-label` classes.
- **Loading**: Always show `<LoadingSpinner />` during data fetch or submission.

### C. Feedback
- **Success**: `toast.success('Message')`
- **Error**: `toast.error(error.response?.data?.error || 'Fallback message')`

---

# Permission Implementation Guide

## 1. How to Add a New Permission Rule

When adding a new module (e.g., "Projects") that requires permission control role-based access control (RBAC):

### Step 1: Update Schema (Optional if generic)
If the `RolePermission` model uses a `module` string field, you don't need to change the schema. Just agree on a module name string, e.g., `"Projects"`.

### Step 2: Register Module in `AuthService` or `RoleController`
Ensure the new module string is added to any list of "Available Modules" used for seeding or validation.

### Step 3: API Middleware
Protect routes using the `checkPermission` middleware:
```typescript
router.post('/', 
    authenticate, 
    checkPermission('Projects', 'create'), // Module, Action
    projectController.create
);
```
*Actions typically include: `create`, `read`, `update`, `delete`.*

### Step 4: Frontend "Can" Utility
Use the `usePermissions` hook to conditional render UI elements:
```typescript
const { can } = usePermissions();

if (can('Projects', 'create')) {
    <button>Create Project</button>
}
```

## 2. Rulebook for Permissions
- **Granularity**: Permissions are per-module, not per-field.
- **Default**: Deny all. Users have `none` access unless explicitly granted.
- **Admin**: `Admin` role bypasses all checks.

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

