import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../helpers/auth.js';
import { fillSignupForm, openSignupModal } from '../helpers/signup.js';

test.describe('純女場次', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
  });

  test('登入後報名純女場次', async ({ page }) => {
    const sessionId = await openSignupModal(page, 'female');
    if (!sessionId) { test.skip(true, '沒有純女場次'); return; }

    await fillSignupForm(page, { name: 'Playwright 女生' });

    await expect(page.locator('#signupModal')).toBeHidden({ timeout: 5000 });
    await expect(page.locator(`#list-${sessionId}`)).toContainText('Playwright 女生');
  });

  test('代報名朋友（純女場次）', async ({ page }) => {
    const sessionId = await openSignupModal(page, 'female');
    if (!sessionId) { test.skip(true, '沒有純女場次'); return; }

    await fillSignupForm(page, {
      name: 'Playwright 女生',
      forFriend: true,
      friendName: '代報名朋友B',
    });

    await expect(page.locator('#signupModal')).toBeHidden({ timeout: 5000 });
    await expect(page.locator(`#list-${sessionId}`)).toContainText('代報名朋友B');
  });

  test('選攜帶器材後顯示在報名列表（純女場次）', async ({ page }) => {
    const sessionId = await openSignupModal(page, 'female');
    if (!sessionId) { test.skip(true, '沒有純女場次'); return; }

    const bringRow = page.locator('#modalBringEquipRow');
    if (!(await bringRow.isVisible())) { test.skip(true, '此場次無器材需求'); return; }

    const chips = page.locator('#modalBringChips button');
    if (!(await chips.count())) { test.skip(true, '無器材 chip'); return; }

    await chips.first().click();
    await fillSignupForm(page, { name: 'Playwright 女生攜帶測試' });

    await expect(page.locator('#signupModal')).toBeHidden({ timeout: 5000 });
    await expect(page.locator(`#list-${sessionId}`)).toContainText('🎒');
  });
});
