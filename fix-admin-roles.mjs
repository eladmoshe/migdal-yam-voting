#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const envPath = new URL('.env.local', import.meta.url);
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.trim();
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local');
  process.exit(1);
}

// SQL to fix admin roles
const fixSQL = `
-- Drop all existing problematic policies
DROP POLICY IF EXISTS "Super admins can read admin roles" ON admin_roles;
DROP POLICY IF EXISTS "Super admins can manage admin roles" ON admin_roles;
DROP POLICY IF EXISTS "Admins can read their own role" ON admin_roles;

-- Create simple, working policies
CREATE POLICY "authenticated users can read admin roles"
  ON admin_roles FOR SELECT
  TO authenticated
  USING (true);

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

async function executeSQL() {
  try {
    console.log('🔧 Connecting to Supabase and fixing RLS policies...\n');

    // Extract project ID from URL
    const projectId = supabaseUrl.split('https://')[1].split('.supabase.co')[0];
    const apiUrl = `${supabaseUrl}/rest/v1/rpc/exec_sql`;

    // Try using fetch to execute SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'params=single-object',
      },
      body: JSON.stringify({ query: fixSQL }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ API Error:', error);
      console.log('\n📝 Instead, please run this SQL manually in Supabase:\n');
      console.log(fixSQL);
      process.exit(1);
    }

    console.log('✅ RLS policies fixed successfully!\n');

    // Verify admin roles
    const verifyResponse = await fetch(`${supabaseUrl}/rest/v1/admin_roles?select=*`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (verifyResponse.ok) {
      const adminRoles = await verifyResponse.json();
      console.log('✅ Current admin roles:');
      console.table(adminRoles);
    }

    console.log('\n✅ Admin setup complete!\n');
    console.log('Next steps:');
    console.log('1. Refresh http://localhost:5174/admin');
    console.log('2. Try logging in with: eladmoshe@gmail.com / your-password');
    console.log('3. If still getting "אין הרשאה", check browser console (F12) for errors\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📝 Please run this SQL manually in Supabase SQL Editor:\n');
    console.log(fixSQL);
    process.exit(1);
  }
}

executeSQL();
