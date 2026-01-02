#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length) env[key.trim()] = val.join('=').trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

async function test() {
  console.log('🔍 Testing database connection...\n');

  // Test 1: Check apartment 27
  console.log('1️⃣ Checking if apartment 27 exists...');
  const { data: apt, error: aptError } = await supabase
    .from('apartments')
    .select('id, number, owner_name, pin_hash')
    .eq('number', '27')
    .single();

  if (aptError) {
    console.log('❌ Error:', aptError.message);
  } else if (!apt) {
    console.log('❌ Apartment 27 NOT FOUND');
  } else {
    console.log('✅ Apartment 27 found:');
    console.log('  - ID:', apt.id);
    console.log('  - Number:', apt.number);
    console.log('  - Owner:', apt.owner_name);
    console.log('  - PIN hash prefix:', apt.pin_hash?.substring(0, 15) + '...');
  }

  // Test 2: Try validate function
  console.log('\n2️⃣ Testing validate_apartment_credentials...');
  const { data: result, error: funcError } = await supabase.rpc('validate_apartment_credentials', {
    p_apartment_number: '27',
    p_pin: '234737'
  });

  if (funcError) {
    console.log('❌ Function error:', funcError.message);
    console.log('   Details:', funcError);
  } else if (!result || result.length === 0) {
    console.log('❌ Function returned no rows (credentials invalid)');
  } else {
    console.log('✅ Function succeeded!');
    console.log('   Result:', result[0]);
  }

  process.exit(0);
}

test().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
