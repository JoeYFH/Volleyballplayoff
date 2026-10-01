import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;

/**
 * 登入測試帳號並把 session 注入瀏覽器
 * 測試帳號需在 Supabase Dashboard > Authentication > Users 建立
 */
export async function loginAsTestUser(page) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (error || !data.session) {
    throw new Error(`測試帳號登入失敗：${error?.message}`);
  }

  const storageKey = `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`;

  await page.addInitScript(({ key, session }) => {
    localStorage.setItem(key, JSON.stringify(session));
  }, { key: storageKey, session: data.session });

  await page.reload();

  // 等待 UI 更新（登入按鈕消失）
  await page.waitForSelector('#loginBtn', { state: 'hidden', timeout: 5000 }).catch(() => {});
}

/**
 * 登出
 */
export async function logout(page) {
  await page.click('#logoutBtn').catch(() => {});
}
