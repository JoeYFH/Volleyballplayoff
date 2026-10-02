import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;

/**
 * 登入測試帳號並把 session 注入瀏覽器
 * 必須在 page.goto() 之前呼叫，讓 init script 在首次導航時執行
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
    localStorage.setItem('lang', 'zh');
  }, { key: storageKey, session: data.session });
}

/**
 * 強制設定 lang=zh（不需登入）
 * 在 page.goto() 前呼叫，確保中文 UI selector 可用
 */
export async function setLangZh(page) {
  await page.addInitScript(() => {
    localStorage.setItem('lang', 'zh');
  });
}

/**
 * 登出
 */
export async function logout(page) {
  // 登出按鈕在 AppHeader，以文字定位
  await page.locator('button:has-text("登出"), button:has-text("Log out"), button:has-text("Logout")').first().click().catch(() => {});
}
