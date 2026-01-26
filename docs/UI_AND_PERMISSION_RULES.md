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
