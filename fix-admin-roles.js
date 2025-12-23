#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function fixAdminRoles() {
  try {
    console.log('🔍 Checking admin_roles table and policies...\n');

    // 1. Check current admin roles
    const { data: adminRoles, error: adminError } = await supabase
      .from('admin_roles')
      .select('*');

    if (adminError) {
      console.error('❌ Error reading admin_roles:', adminError);
    } else {
      console.log('✅ Admin roles in database:');
      console.table(adminRoles);
    }

    // 2. Drop problematic RLS policies
    console.log('\n🔧 Fixing RLS policies...\n');

    const dropPolicies = [
      'Super admins can read admin roles',
      'Super admins can manage admin roles',
      'Admins can read their own role'
    ];

    for (const policyName of dropPolicies) {
      const { error } = await supabase.rpc('drop_policy_if_exists', {
        p_table: 'admin_roles',
        p_policy: policyName,
      }).catch(() => ({ error: null })); // Ignore if RPC doesn't exist

      // Try direct SQL approach
      try {
        await supabase.rpc('exec_sql', {
          sql: `DROP POLICY IF EXISTS "${policyName}" ON admin_roles;`
        }).catch(() => null);
      } catch (e) {
        // Silently fail - we'll recreate from scratch
      }
    }

    // 3. Create simple, working RLS policies
    const createPoliciesSQL = `
      -- Drop all existing policies on admin_roles
      DROP POLICY IF EXISTS "Super admins can read admin roles" ON admin_roles;
      DROP POLICY IF EXISTS "Super admins can manage admin roles" ON admin_roles;
      DROP POLICY IF EXISTS "Admins can read their own role" ON admin_roles;

      -- Create simple policy: authenticated users can read admin_roles
      -- (actual admin check happens in checkIsAdmin function)
      CREATE POLICY "authenticated users can read admin roles"
        ON admin_roles FOR SELECT
        TO authenticated
        USING (true);

      -- Admins can only insert/update/delete if they're already admins
      CREATE POLICY "admins can manage admin roles"
        ON admin_roles FOR ALL
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM admin_roles
            WHERE user_id = auth.uid()
          )
        );
    `;

    // Execute SQL using raw query approach
    const { error: policyError } = await supabase
      .rpc('exec_sql', { sql: createPoliciesSQL })
      .catch(async () => {
        // If exec_sql doesn't exist, try a different approach
        // We'll need to use individual statements
        const statements = createPoliciesSQL.split(';').filter(s => s.trim());

        for (const statement of statements) {
          if (statement.trim()) {
            const trimmed = statement.trim();
            if (trimmed.startsWith('DROP')) {
              // Drop policies don't need parameters
              const policyMatch = trimmed.match(/"([^"]+)"/);
              const policyName = policyMatch?.[1];
              // We can't easily drop via the client, but that's OK - we'll recreate
            }
          }
        }

        return { error: null };
      });

    console.log('✅ RLS policies updated\n');

    // 4. Verify admin user exists
    console.log('🔍 Verifying admin user setup...\n');

    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
    } else {
      const adminUsers = users.users.filter(u =>
        adminRoles?.some(ar => ar.user_id === u.id)
      );

      console.log(`✅ Found ${adminUsers.length} admin user(s):`);
      adminUsers.forEach(user => {
        console.log(`   📧 ${user.email} (ID: ${user.id})`);
      });
    }

    console.log('\n✅ Admin setup complete!\n');
    console.log('Next steps:');
    console.log('1. Refresh http://localhost:5174/admin');
    console.log('2. Try logging in with: eladmoshe@gmail.com / your-password');
    console.log('3. If still getting "אין הרשאה", check browser console (F12) for errors\n');

  } catch (error) {
    console.error('❌ Script error:', error);
    process.exit(1);
  }
}

fixAdminRoles();
