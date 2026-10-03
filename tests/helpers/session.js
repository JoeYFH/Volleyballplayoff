import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;

let _client = null;
let _user = null;

async function getClient() {
  if (_client) return { supabase: _client, user: _user };
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  if (error) throw new Error(`登入失敗：${error.message}`);
  _user = data.user;
  _client = supabase;
  return { supabase, user: data.user };
}

/**
 * 建立測試用場次，回傳 session id
 * creator_name / creator_photo / created_by 皆從已登入的測試帳號取得
 * @param {'male'|'female'|'mixed'} type
 * @param {object} options
 */
export async function createTestSession(type, options = {}) {
  const { supabase, user } = await getClient();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().slice(0, 10);

  const maleLimit  = options.maleLimit  ?? (type === 'mixed' ? 6 : 0);
  const femaleLimit = options.femaleLimit ?? (type === 'mixed' ? 6 : 0);
  const limitTotal  = options.limitTotal  ?? (type === 'mixed' ? 0 : 12);

  const creatorName  = user?.user_metadata?.full_name || user?.user_metadata?.name || '測試帳號';
  const creatorPhoto = user?.user_metadata?.avatar_url || null;

  const payload = {
    title:       `[測試場次] ${type}`,
    date:        dateStr,
    time:        '19:00',
    location:    '測試球館',
    venue:       '場館一樓大廳集合',
    type,
    is_open:     options.is_open ?? true,
    is_private:  options.is_private ?? false,
    limit_total: limitTotal,
    male_limit:  maleLimit,
    female_limit: femaleLimit,
    equipment:   ['球', '標竿'],
    note:        '這是測試用的備注，只有開場者看得到',
    creator_name:  creatorName,
    creator_photo: creatorPhoto,
    created_by:    user.id,
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
 * 更新場次欄位
 */
export async function updateTestSession(sessionId, fields) {
  const { supabase } = await getClient();
  const { error } = await supabase.from('sessions').update(fields).eq('id', sessionId);
  if (error) throw new Error(`更新場次失敗：${error.message}`);
}

/**
 * 刪除測試場次（CASCADE 處理 signups）
 */
export async function deleteTestSession(sessionId) {
  if (!sessionId) return;
  try {
    const { supabase } = await getClient();
    await supabase.from('sessions').delete().eq('id', sessionId);
  } catch (e) {
    console.error(`[afterAll] 刪除測試場次失敗 ${sessionId}：${e.message}`);
  }
}

/**
 * 清理所有名稱以 [測試範本] 開頭的範本（供 afterAll 使用）
 */
export async function deleteTestTemplates() {
  try {
    const { supabase, user } = await getClient();
    await supabase.from('templates').delete()
      .eq('user_id', user.id)
      .ilike('name', '[測試範本]%');
  } catch (e) {
    console.error(`[afterAll] 清理測試範本失敗：${e.message}`);
  }
}

/**
 * 建立測試回饋，回傳 feedback id
 * feedback 允許任何人新增（RLS insert policy: true）
 */
export async function createTestFeedback(description = '[自動測試] 測試回饋', options = {}) {
  const { supabase } = await getClient();
  // Generate UUID client-side: avoids RETURNING which is blocked by admin-only SELECT RLS
  const id = crypto.randomUUID();
  const { error } = await supabase
    .from('feedback')
    .insert({
      id,
      description,
      type: options.type || 'other',
      urgency: options.urgency || 'low',
      status: options.status || 'pending',
      email: options.email || '',
    });
  if (error) throw new Error(`建立測試回饋失敗：${error.message}`);
  return id;
}

/**
 * 刪除測試回饋（需 admin 權限的 RLS，測試帳號需為 admin）
 */
export async function deleteTestFeedbacks(ids) {
  if (!ids?.length) return;
  try {
    const { supabase } = await getClient();
    await supabase.from('feedback').delete().in('id', ids);
  } catch (e) {
    console.error(`[afterAll] 清理測試回饋失敗：${e.message}`);
  }
}
