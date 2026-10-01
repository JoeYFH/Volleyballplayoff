import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../helpers/auth.js';
import { fillSignupForm, openSignupModal } from '../helpers/signup.js';
import { createTestSession, deleteTestSession } from '../helpers/session.js';

let sessionId;

test.describe('純女場次', () => {
  test.beforeAll(async () => {
    sessionId = await createTestSession('female');
  });

  test.afterAll(async () => {
    await deleteTestSession(sessionId);
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
  });

  test('登入後報名純女場次', async ({ page }) => {
    const id = await openSignupModal(page, 'female', sessionId);
    if (!id) { test.skip(true, '找不到純女場次'); return; }

    await fillSignupForm(page, { name: 'Playwright 女生' });

    await expect(page.locator('#signupModal')).toBeHidden({ timeout: 5000 });
    await expect(page.locator(`#list-${id}`)).toContainText('Playwright 女生');
  });

  test('代報名朋友（純女場次）', async ({ page }) => {
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
    const id = await openSignupModal(page, 'female', sessionId);
    if (!id) { test.skip(true, '找不到純女場次'); return; }

    const bringRow = page.locator('#modalBringEquipRow');
    if (!(await bringRow.isVisible())) { test.skip(true, '此場次無器材需求'); return; }

    const chips = page.locator('#modalBringChips button');
    if (!(await chips.count())) { test.skip(true, '無器材 chip'); return; }

    await chips.first().click();
    await fillSignupForm(page, { name: 'Playwright 女生攜帶測試' });

    await expect(page.locator('#signupModal')).toBeHidden({ timeout: 5000 });
    await expect(page.locator(`#list-${id}`)).toContainText('🎒');
  });
});
