# How to Add New Permission Module - Complete Guide

## 📋 Checklist for Adding New Permission Module

When adding a new module that needs permissions (e.g., LeadActivity, ProjectTask, etc.), follow these steps **IN ORDER**:

---

## Step 1: Add to SYSTEM_MODULES Array ⭐ **CRITICAL**

**File:** `/backend/src/controllers/role.controller.ts`

**Location:** Line 6-11

```typescript
export const SYSTEM_MODULES = [
    'Dashboard', 'Company', 'User', 'Role',
    'Client', 'Lead', 'LeadActivity',  // ← Add your new module here
    'Quotation', 'Invoice', 'Payment', 'Subscription',
    'Department', 'Position', 'Employee', 'Attendance', 'Leave', 
    'LeaveType', 'LeaveBalance', 'Shift', 'ShiftRoster', 'Payroll', 'Asset',
    'Recruitment', 'Document', 'Holiday'
];
```

**Why:** This array controls:
- Which modules appear in permission matrix UI
- Which modules get synced when "Sync System Permissions" is clicked
- Available modules for permission checks

**⚠️ IMPORTANT:** Module name must be **PascalCase** (e.g., `LeadActivity`, not `leadActivity`)

---

## Step 2: Create Database Permissions

**File:** Create new SQL file in `/backend/scripts/`

**Example:** `create-[module-name]-permissions.sql`

```sql
-- Create [ModuleName] permissions for Admin role

DO $$
DECLARE
    admin_role_id UUID;
BEGIN
    -- Get Admin role ID
    SELECT id INTO admin_role_id FROM "Role" WHERE name = 'Admin' LIMIT 1;
    
    IF admin_role_id IS NULL THEN
        RAISE EXCEPTION 'Admin role not found!';
    END IF;
    
    -- Insert permission for Admin role
    INSERT INTO "RolePermission" (
        id, 
        "roleId", 
        module, 
        "createLevel", 
        "readLevel", 
        "updateLevel", 
        "deleteLevel", 
        "createdAt"
    )
    VALUES (
        gen_random_uuid(),
        admin_role_id,
        'ModuleName',  -- ← Your module name here
        'all',         -- Admin gets full access
        'all',
        'all',
        'all',
        NOW()
    )
    ON CONFLICT ("roleId", module) 
    DO UPDATE SET
        "createLevel" = 'all',
        "readLevel" = 'all',
        "updateLevel" = 'all',
        "deleteLevel" = 'all';
    
    RAISE NOTICE 'ModuleName permissions created/updated for Admin role';
END $$;

-- Verify
SELECT 
    r.name as role_name,
    rp.module,
    rp."createLevel",
    rp."readLevel",
    rp."updateLevel",
    rp."deleteLevel"
FROM "RolePermission" rp
JOIN "Role" r ON r.id = rp."roleId"
WHERE rp.module = 'ModuleName';
```

**Run SQL:**
```bash
docker exec -i applizor-postgres psql -U applizor -d applizor_erp < backend/scripts/create-[module-name]-permissions.sql
```

---

## Step 3: Add to Frontend TypeScript Types

**File:** `/frontend/hooks/usePermission.ts`

**Location:** Around line 4-20

```typescript
export type PermissionModule = 
  | 'Employee' 
  | 'Department' 
  | 'Position' 
  | 'Asset' 
  | 'Attendance' 
  | 'Holiday' 
  | 'Leave' 
  | 'LeaveBalance' 
  | 'Shift' 
  | 'ShiftRoster'
  | 'LeaveApproval'
  | 'Client'
  | 'Lead'
  | 'LeadActivity'      // ← Add your module here
  | 'Quotation'
  | 'Invoice';
```

**Why:** TypeScript will give autocomplete and type safety when using `can('ModuleName', 'action')`

---

## Step 4: Update Backend Controllers

**Files:** Your module's controller files (e.g., `/backend/src/controllers/[module].controller.ts`)

**Add permission checks to all CRUD operations:**

### Create Operation:
```typescript
export const createItem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = req.user;
    
    // ✅ Check create permission
    if (!PermissionService.hasBasicPermission(user, 'ModuleName', 'create')) {
      return res.status(403).json({ error: 'Access denied: No create rights for ModuleName' });
    }

    // Your create logic here...
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create' });
  }
};
```

### Read Operation:
```typescript
export const getItems = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    
    // ✅ Check read permission
    if (!PermissionService.hasBasicPermission(user, 'ModuleName', 'read')) {
      return res.status(403).json({ error: 'Access denied: No read rights for ModuleName' });
    }

    // ✅ Get scoped filter (for owned/added filtering)
    const scopeFilter = await PermissionService.getScopedWhereClause(
      user, 
      'ModuleName', 
      'read', 
      'TableName',        // Database table name
      'createdBy',        // Field for "added" check
      'assignedTo'        // Field for "owned" check
    );

    const items = await prisma.tableName.findMany({
      where: {
        AND: [
          { companyId: user.companyId },  // Company filter
          scopeFilter                      // Permission filter
        ]
      }
    });

    res.json(items);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
};
```

### Update Operation:
```typescript
export const updateItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    // ✅ Check update permission
    if (!PermissionService.hasBasicPermission(user, 'ModuleName', 'update')) {
      return res.status(403).json({ error: 'Access denied: No update rights for ModuleName' });
    }

    // ✅ Verify access to this specific record
    const scopeFilter = await PermissionService.getScopedWhereClause(
      user, 'ModuleName', 'update', 'TableName', 'createdBy', 'assignedTo'
    );

    const count = await prisma.tableName.count({
      where: { AND: [{ id }, scopeFilter] }
    });

    if (count === 0) {
      return res.status(403).json({ error: 'Access denied to this record' });
    }

    // Your update logic here...
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update' });
  }
};
```

### Delete Operation:
```typescript
export const deleteItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    // ✅ Check delete permission
    if (!PermissionService.hasBasicPermission(user, 'ModuleName', 'delete')) {
      return res.status(403).json({ error: 'Access denied: No delete rights for ModuleName' });
    }

    // ✅ Verify access to this specific record
    const scopeFilter = await PermissionService.getScopedWhereClause(
      user, 'ModuleName', 'delete', 'TableName', 'createdBy', 'assignedTo'
    );

    const count = await prisma.tableName.count({
      where: { AND: [{ id }, scopeFilter] }
    });

    if (count === 0) {
      return res.status(403).json({ error: 'Access denied to this record' });
    }

    // Your delete logic here...
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete' });
  }
};
```

**Don't forget to import:**
```typescript
import { PermissionService } from '../services/permission.service';
```

---

## Step 5: Add Frontend Permission Guards

**Files:** Your module's frontend pages/components

### Page-Level Protection:
```typescript
'use client';

import { usePermission } from '@/hooks/usePermission';
import AccessDenied from '@/components/AccessDenied';

export default function ModulePage() {
    const { can, user } = usePermission();

    // ✅ Page-level check (after all hooks)
    if (user && !can('ModuleName', 'read')) {
        return <AccessDenied />;
    }

    return (
        <div>
            {/* Your page content */}
        </div>
    );
}
```

### Button-Level Protection:
```tsx
import { usePermission } from '@/hooks/usePermission';

export default function Component() {
    const { can } = usePermission();

    return (
        <div>
            {/* ✅ Create button */}
            {can('ModuleName', 'create') && (
                <button onClick={handleCreate}>
                    Add New Item
                </button>
            )}

            {/* ✅ Edit button */}
            {can('ModuleName', 'update') && (
                <button onClick={handleEdit}>
                    Edit
                </button>
            )}

            {/* ✅ Delete button */}
            {can('ModuleName', 'delete') && (
                <button onClick={handleDelete}>
                    Delete
                </button>
            )}
        </div>
    );
}
```

### Using PermissionGuard Component:
```tsx
import PermissionGuard from '@/components/PermissionGuard';

<PermissionGuard module="ModuleName" action="create">
    <button>Add New Item</button>
</PermissionGuard>
```

---

## Step 6: Sync Permissions in UI

### After All Code Changes:

1. **Restart Backend** (if running)
   ```bash
   # Backend will pick up SYSTEM_MODULES changes
   ```

2. **Go to Roles & Permissions Page**
   - Navigate to: `http://localhost:3000/settings/roles`

3. **Click "Sync System Permissions" Button**
   - This will create RolePermission entries for all roles
   - New module will appear in permission matrix

4. **Edit Roles**
   - Click "Edit" on any role
   - You'll see your new module in the matrix
   - Configure permissions (all/owned/added/none)

5. **Users Must Re-login**
   - Logout and login again to get fresh permissions

---

## 📝 Complete Example: LeadActivity Module

### 1. SYSTEM_MODULES:
```typescript
// backend/src/controllers/role.controller.ts
export const SYSTEM_MODULES = [
    'Dashboard', 'Company', 'User', 'Role',
    'Client', 'Lead', 'LeadActivity', // ← Added
    'Quotation', 'Invoice', 'Payment', 'Subscription',
    ...
];
```

### 2. Database:
```sql
-- backend/scripts/create-lead-activity-permissions.sql
INSERT INTO "RolePermission" (...) VALUES (...);
```

### 3. TypeScript Type:
```typescript
// frontend/hooks/usePermission.ts
export type PermissionModule = 
  | 'Lead'
  | 'LeadActivity'  // ← Added
  | 'Client'
  ...
```

### 4. Backend Controllers:
```typescript
// backend/src/controllers/lead.controller.ts
export const getLeadActivities = async (req: AuthRequest, res: Response) => {
  if (!PermissionService.hasBasicPermission(user, 'LeadActivity', 'read')) {
    return res.status(403).json({ error: 'Access denied' });
  }
  // ...
};

export const addLeadActivity = async (req: AuthRequest, res: Response) => {
  if (!PermissionService.hasBasicPermission(user, 'LeadActivity', 'create')) {
    return res.status(403).json({ error: 'Access denied' });
  }
  // ...
};
```

### 5. Frontend Guards:
```tsx
// frontend/app/(main)/leads/[id]/page.tsx
{can('LeadActivity', 'create') && (
    <button onClick={() => setShowActivityModal(true)}>
        Add Activity
    </button>
)}

{can('LeadActivity', 'update') && (
    <button onClick={() => handleEdit(activity)}>
        Edit
    </button>
)}

{can('LeadActivity', 'delete') && (
    <button onClick={() => handleDelete(activity.id)}>
        Delete
    </button>
)}
```

---

## ⚠️ Common Mistakes to Avoid

### ❌ Wrong:
```typescript
// Lowercase module name
can('leadactivity', 'create')

// Missing from SYSTEM_MODULES
// Module won't appear in UI even if DB has permissions

// Checking wrong module
if (!PermissionService.hasBasicPermission(user, 'Lead', 'create')) {
  // Should be 'LeadActivity' not 'Lead'
}
```

### ✅ Correct:
```typescript
// PascalCase module name
can('LeadActivity', 'create')

// Added to SYSTEM_MODULES array
export const SYSTEM_MODULES = [..., 'LeadActivity', ...]

// Correct module name
if (!PermissionService.hasBasicPermission(user, 'LeadActivity', 'create')) {
  return res.status(403).json({ error: 'Access denied' });
}
```

---

## 🔍 Verification Checklist

After adding a new module, verify:

- [ ] Module added to `SYSTEM_MODULES` array
- [ ] Database permissions created (SQL run successfully)
- [ ] TypeScript type updated in `usePermission.ts`
- [ ] Backend controllers have permission checks
- [ ] Frontend has permission guards on buttons/pages
- [ ] Backend restarted
- [ ] "Sync System Permissions" clicked in UI
- [ ] Module appears in permission matrix when editing roles
- [ ] Users re-logged in to get fresh permissions
- [ ] Permissions working (buttons hide/show correctly)

---

## 📂 Quick Reference: File Locations

| What | File Path |
|------|-----------|
| SYSTEM_MODULES | `/backend/src/controllers/role.controller.ts` (Line 6) |
| Database Script | `/backend/scripts/create-[module]-permissions.sql` |
| TypeScript Type | `/frontend/hooks/usePermission.ts` (Line 4-20) |
| Backend Controllers | `/backend/src/controllers/[module].controller.ts` |
| Frontend Pages | `/frontend/app/(main)/[module]/...` |
| Permission Service | `/backend/src/services/permission.service.ts` |
| Sync API | `/backend/src/controllers/role.controller.ts` (syncPermissions) |

---

## 🎯 Summary

**Every time you add a new permission module:**

1. ⭐ Add to `SYSTEM_MODULES` array (MOST IMPORTANT!)
2. Create database permissions (SQL script)
3. Add to TypeScript types
4. Add permission checks in backend controllers
5. Add permission guards in frontend
6. Restart backend
7. Sync permissions in UI
8. Users re-login

**Follow this order to avoid issues!** 🚀

---

## 💡 Pro Tips

1. **Module Naming:** Always use PascalCase (e.g., `LeadActivity`, not `Lead_Activity` or `leadActivity`)

2. **Granular Modules:** Create separate modules for sub-features that need independent permissions
   - Example: `Lead` and `LeadActivity` are separate
   - This allows: "User can view leads but not manage activities"

3. **Default to 'none':** When syncing, new modules default to 'none' for all actions
   - Admin must explicitly grant permissions

4. **Test Permissions:** Always test with a non-admin user to verify restrictions work

5. **Document Changes:** Update this guide if permission system changes

---

**Keep this document handy for future permission module additions!** 📚
