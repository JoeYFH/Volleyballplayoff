#!/usr/bin/env node
/**
 * 清除所有殘留的測試場次（title 以 [測試場次] 開頭）
 * 使用方式：node scripts/cleanup-test-sessions.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.test' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

const { error: authError } = await supabase.auth.signInWithPassword({
  email: process.env.TEST_EMAIL,
  password: process.env.TEST_PASSWORD,
});

if (authError) {
  console.error('登入失敗：', authError.message);
  process.exit(1);
}

const { data, error } = await supabase
  .from('sessions')
  .delete()
  .like('title', '[測試場次]%')
  .select('id, title');

if (error) {
  console.error('刪除失敗：', error.message);
  process.exit(1);
}

if (!data?.length) {
  console.log('沒有殘留的測試場次。');
} else {
  console.log(`已刪除 ${data.length} 個測試場次：`);
  for (const s of data) console.log(`  - ${s.title}（${s.id}）`);
}
