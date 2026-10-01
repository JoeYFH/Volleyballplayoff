import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../helpers/auth.js';
import { fillSignupForm, openSignupModal } from '../helpers/signup.js';
import { createTestSession, deleteTestSession } from '../helpers/session.js';

let sessionId;

test.describe.serial('純男場次', () => {
  test('建立測試場次（純男）', async () => {
    sessionId = await createTestSession('male');
    expect(sessionId).toBeTruthy();
    console.log(`\n🏐 純男測試場次建立：${sessionId}`);
  });

  test('登入後報名純男場次', async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
    const id = await openSignupModal(page, 'male', sessionId);
    if (!id) { test.skip(true, '找不到純男場次'); return; }

    await fillSignupForm(page, { name: 'Playwright 男生' });

    await expect(page.locator('#signupModal')).toBeHidden({ timeout: 5000 });
    await expect(page.locator(`#list-${id}`)).toContainText('(me)');
  });

  test('代報名朋友（純男場次）', async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
    const id = await openSignupModal(page, 'male', sessionId);
    if (!id) { test.skip(true, '找不到純男場次'); return; }

    await fillSignupForm(page, {
      name: 'Playwright 男生',
      forFriend: true,
      friendName: '代報名朋友A',
    });

    await expect(page.locator('#signupModal')).toBeHidden({ timeout: 5000 });
    await expect(page.locator(`#list-${id}`)).toContainText('代報名朋友A');
  });

  test('選攜帶器材後顯示在報名列表（純男場次）', async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
    const id = await openSignupModal(page, 'male', sessionId);
    if (!id) { test.skip(true, '找不到純男場次'); return; }

    const bringRow = page.locator('#modalBringEquipRow');
    if (!(await bringRow.isVisible())) { test.skip(true, '此場次無器材需求'); return; }

    const chips = page.locator('#modalBringChips button');
    if (!(await chips.count())) { test.skip(true, '無器材 chip'); return; }

    await chips.first().click();
    await fillSignupForm(page, { name: 'Playwright 攜帶測試' });

    await expect(page.locator('#signupModal')).toBeHidden({ timeout: 5000 });
    await expect(page.locator(`#list-${id}`)).toContainText('🎒');
  });

  test('刪除測試場次（純男）', async () => {
    await deleteTestSession(sessionId);
    console.log(`\n🗑️  純男測試場次刪除：${sessionId}`);
  });
});
