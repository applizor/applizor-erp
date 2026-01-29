# Applizor ERP Development Rulebook

This document outlines the mandatory development standards and rules for the Applizor ERP project. All contributors must adhere to these guidelines.

## UI & UX Standards

### 1. No Browser Native Dialogs
- **Rule**: Never use `window.alert()`, `window.confirm()`, or `window.prompt()`.
- **Reason**: These native dialogs interrupt the user experience and do not match the premium aesthetics of the application.
- **Alternative**: Use custom modals, toast notifications (using `useToast`), or inline feedback components.

### 2. No Browser Native Selects
- **Rule**: Avoid using the native `<select>` tag.
- **Reason**: Native selects vary by operating system and often look "cheap" or "unpolished" compared to a custom-styled enterprise UI.
- **Alternative**: Use the custom `CustomSelect` or `MultiSelect` components from `@/components/ui`.

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
