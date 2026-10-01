import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../helpers/auth.js';
import { fillSignupForm, openSignupModal } from '../helpers/signup.js';
import { createTestSession, deleteTestSession } from '../helpers/session.js';

let sessionId;

test.describe.serial('純女場次', () => {
  test('建立測試場次（純女）', async () => {
    sessionId = await createTestSession('female');
    expect(sessionId).toBeTruthy();
    console.log(`\n🏐 純女測試場次建立：${sessionId}`);
  });

  test('場次卡片顯示活動詳細說明與備注（純女）', async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
    await page.waitForSelector('#loadingSpinner', { state: 'hidden', timeout: 10000 });
    await page.click('#sg-female');
    await page.waitForTimeout(300);

    // 活動詳細說明顯示在主頁場次卡片
    await expect(page.locator(`#card-${sessionId}`)).toContainText('場館一樓大廳集合');

    // 備注顯示在 my-sessions 開場者管理頁
    await page.goto('/my-sessions.html');
    await loginAsTestUser(page);
    await expect(page.locator('body')).toContainText('這是測試用的備注', { timeout: 10000 });
  });

  test('登入後報名純女場次', async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
    const id = await openSignupModal(page, 'female', sessionId);
    if (!id) { test.skip(true, '找不到純女場次'); return; }

    await fillSignupForm(page, { name: 'Playwright 女生' });

    await expect(page.locator('#signupModal')).toBeHidden({ timeout: 5000 });
    await expect(page.locator(`#list-${id}`)).toContainText('(me)');
  });

  test('代報名朋友（純女場次）', async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
    const id = await openSignupModal(page, 'female', sessionId);
    if (!id) { test.skip(true, '找不到純女場次'); return; }

    await fillSignupForm(page, {
      name: 'Playwright 女生',
      forFriend: true,
      friendName: '代報名朋友B',
    });

    await expect(page.locator('#signupModal')).toBeHidden({ timeout: 5000 });
    await expect(page.locator(`#list-${id}`)).toContainText('代報名朋友B');
  });

  test('選攜帶器材後顯示在報名列表（純女場次）', async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
    const id = await openSignupModal(page, 'female', sessionId);
    if (!id) { test.skip(true, '找不到純女場次'); return; }

    const bringRow = page.locator('#modalBringEquipRow');
    if (!(await bringRow.isVisible())) { test.skip(true, '此場次無器材需求'); return; }

    const chips = page.locator('#modalBringChips button');
    if (!(await chips.count())) { test.skip(true, '無器材 chip'); return; }

    await chips.first().click();
    await fillSignupForm(page, { name: 'Playwright 女生攜帶測試', forFriend: true, friendName: '器材測試朋友(女)' });

    await expect(page.locator('#signupModal')).toBeHidden({ timeout: 5000 });
    await expect(page.locator(`#list-${id}`)).toContainText('🎒');
  });

  test('刪除測試場次（純女）', async () => {
    await deleteTestSession(sessionId);
    console.log(`\n🗑️  純女測試場次刪除：${sessionId}`);
  });
});
