// Mock WebSocket to prevent crash under Node.js < 22
global.WebSocket = class {};

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load env variables manually from project root .env
const envPath = './.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length > 0) {
    env[key.trim()] = val.join('=').trim();
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Checking tables structure and executing diagnostic checks...");

  // 1. Check students table columns
  console.log("\n1. Testing query on 'students' table...");
  const { data: students, error: stuErr } = await supabase
    .from('students')
    .select('*')
    .limit(1);
    
  if (stuErr) {
    console.error("❌ 'students' query failed:", stuErr);
  } else {
    console.log("✅ 'students' query succeeded. Existing students:", students);
  }

  // 2. Check attendance table columns
  console.log("\n2. Testing query on 'attendance' table...");
  const { data: logs, error: logErr } = await supabase
    .from('attendance')
    .select('*')
    .limit(1);

  if (logErr) {
    console.error("❌ 'attendance' query failed:", logErr);
  } else {
    console.log("✅ 'attendance' query succeeded. Sample logs:", logs);
  }

  // 3. Try to insert a dummy log to see where it fails
  console.log("\n3. Testing test insert into 'attendance' with select join...");
  const dummyPayload = {
    student_id: students && students[0] ? students[0].id : 'TEST_ID',
    date: new Date().toISOString().split('T')[0],
    check_in: new Date().toISOString(),
    status: 'Present',
    course: 'General'
  };
  
  console.log("Attempting insert with payload:", dummyPayload);
  const { data: inserted, error: insertErr } = await supabase
    .from('attendance')
    .insert([dummyPayload])
    .select('*, students(name, email, courses)');

  if (insertErr) {
    console.error("❌ Insert failed with error details:\n", JSON.stringify(insertErr, null, 2));
  } else {
    console.log("✅ Insert succeeded! Cleared check log:", inserted);
    // Delete the test log
    await supabase.from('attendance').delete().eq('id', inserted[0].id);
    console.log("Cleaned up test insert row.");
  }

  // 4. Test selecting all logs with join
  console.log("\n4. Testing select from 'attendance' with join...");
  const { data: selectLogs, error: selectLogsErr } = await supabase
    .from('attendance')
    .select('*, students(name, email, courses)')
    .order('created_at', { ascending: false });

  if (selectLogsErr) {
    console.error("❌ Select with join failed with error details:\n", JSON.stringify(selectLogsErr, null, 2));
  } else {
    console.log("✅ Select with join succeeded! Logs count:", selectLogs.length);
  }
}

test().catch(err => {
  console.error(err);
});
