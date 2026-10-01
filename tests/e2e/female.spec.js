import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { loginAsTestUser } from '../helpers/auth.js';
import { fillSignupForm, openSignupModal, clickStatusFilter, clickGenderFilter } from '../helpers/signup.js';
import { createTestSession, deleteTestSession } from '../helpers/session.js';

test.describe.serial('純女場次', () => {
  let sessionId;

  test.beforeAll(async () => {
    sessionId = await createTestSession('female');
    expect(sessionId).toBeTruthy();
    console.log(`\n🏐 純女測試場次：${sessionId}`);
  });

  test.afterAll(async () => {
    await deleteTestSession(sessionId);
    console.log(`\n🗑️  純女測試場次刪除：${sessionId}`);
  });

  test('場次卡片顯示活動詳細資訊', async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
    await page.waitForLoadState('networkidle');

    await clickStatusFilter(page, '所有');
    await clickGenderFilter(page, '♀ 女生');

    await expect(page.locator(`#card-${sessionId}`)).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`#card-${sessionId}`)).toContainText('場館一樓大廳集合');
  });

  test('備注欄位正確儲存於資料庫，creator 資訊完整', async () => {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    const { data } = await supabase.from('sessions').select('note, creator_name, created_by').eq('id', sessionId).single();
    expect(data?.note).toContain('這是測試用的備注');
    expect(data?.creator_name).toBeTruthy();
    expect(data?.creator_name).not.toBe('test');
    expect(data?.created_by).toBeTruthy();
  });

  test('代報名朋友（純女場次）', async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
    await page.waitForLoadState('networkidle');

    await clickStatusFilter(page, '所有');
    await clickGenderFilter(page, '♀ 女生');

    await openSignupModal(page, sessionId);
    await fillSignupForm(page, { forFriend: true, friendName: '代報名朋友B' });

    await expect(page.locator('div.fixed.inset-0.z-40')).toBeHidden({ timeout: 8000 });
    await expect(page.locator(`#list-${sessionId}`)).toContainText('代報名朋友B', { timeout: 5000 });
  });
});
