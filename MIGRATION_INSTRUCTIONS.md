# Database Migration Instructions

## Apartment Management Functions Migration

This migration adds two new RPC functions for apartment management:
- `update_apartment_owner` - Update apartment owner name
- `delete_apartment` - Delete apartment (and associated votes)

### How to Apply

1. Log in to your Supabase Dashboard: https://supabase.com/dashboard/project/[your-project-id]

2. Navigate to **SQL Editor**

3. Open the migration file: `supabase/migrations/008_apartment_management_functions.sql`

4. Copy the entire contents of the file

5. Paste into the SQL Editor and click **Run**

6. Verify the functions were created successfully by checking the Database → Functions section

### Testing the Migration

After applying the migration, you can test the functions in the SQL Editor:

```sql
-- Test update apartment owner (replace with actual apartment ID)
SELECT update_apartment_owner(
  'your-apartment-id-here'::uuid,
  'New Owner Name'
);

-- Test delete apartment (WARNING: This deletes the apartment and all votes!)
-- Only test on a development/staging database
SELECT delete_apartment('your-apartment-id-here'::uuid);
```

### Rollback (if needed)

If you need to rollback these functions:

```sql
DROP FUNCTION IF EXISTS update_apartment_owner(UUID, TEXT);
DROP FUNCTION IF EXISTS delete_apartment(UUID);
```

### Next Steps

Once the migration is applied:
1. The admin dashboard will show a "ניהול דירות" (Manage Apartments) button
2. Clicking it will show a table of all apartments
3. From the table, admins can:
   - Edit apartment owner names (✏️ שם button)
   - Reset apartment PINs (🔑 PIN button)
   - Delete apartments (🗑️ מחק button)

All operations are logged in the audit system for security tracking.
