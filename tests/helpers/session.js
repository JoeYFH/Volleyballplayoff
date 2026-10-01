import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;

async function getClient() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { error } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  if (error) throw new Error(`登入失敗：${error.message}`);
  return supabase;
}

/**
 * 建立測試用場次，回傳 session id
 * @param {'male'|'female'|'mixed'} type
 * @param {{ maleLimit?: number, femaleLimit?: number }} options
 */
export async function createTestSession(type, options = {}) {
  const supabase = await getClient();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().slice(0, 10);

  const maleLimit = options.maleLimit ?? (type === 'mixed' ? 6 : 0);
  const femaleLimit = options.femaleLimit ?? (type === 'mixed' ? 6 : 0);

  const payload = {
    title: `[測試場次] ${type}`,
    date: dateStr,
    time: '19:00',
    location: '測試球館',
    type,
    is_open: true,
    limit_total: type === 'mixed' ? 0 : 12,
    male_limit: maleLimit,
    female_limit: femaleLimit,
    equipment: ['球', '氣瓶'],
    venue: '場館一樓大廳集合，場地在二樓 B4',
    note: '這是測試用的備注，只有開場者看得到',
  };

  const { data, error } = await supabase
    .from('sessions')
    .insert(payload)
    .select('id')
    .single();

  if (error) throw new Error(`建立測試場次失敗：${error.message}`);
  return data.id;
}

/**
 * 刪除測試場次（連同 signups 一起，由 CASCADE 處理）
 */
export async function deleteTestSession(sessionId) {
  if (!sessionId) return;
  try {
    const supabase = await getClient();
    const { error } = await supabase.from('sessions').delete().eq('id', sessionId);
    if (error) console.error(`[afterAll] 刪除測試場次失敗 ${sessionId}：${error.message}`);
  } catch (e) {
    console.error(`[afterAll] 刪除測試場次例外 ${sessionId}：${e.message}`);
  }
}
