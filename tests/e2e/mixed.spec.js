import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../helpers/auth.js';
import { fillSignupForm, openSignupModal } from '../helpers/signup.js';
import { createTestSession, deleteTestSession } from '../helpers/session.js';

let sessionId;

test.describe('混排場次', () => {
  test.beforeAll(async () => {
    sessionId = await createTestSession('mixed');
  });

  test.afterAll(async () => {
    await deleteTestSession(sessionId);
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
  });

  test('報名混排場次（男）', async ({ page }) => {
    const id = await openSignupModal(page, 'mixed', sessionId);
    if (!id) { test.skip(true, '找不到混排場次'); return; }

    await fillSignupForm(page, { name: 'Playwright 混排男', gender: 'male' });

    await expect(page.locator('#signupModal')).toBeHidden({ timeout: 5000 });
    await expect(page.locator(`#list-${id}`)).toContainText('Playwright 混排男');
  });

  test('報名混排場次（女）', async ({ page }) => {
    const id = await openSignupModal(page, 'mixed', sessionId);
    if (!id) { test.skip(true, '找不到混排場次'); return; }

    await fillSignupForm(page, { name: 'Playwright 混排女', gender: 'female' });

    await expect(page.locator('#signupModal')).toBeHidden({ timeout: 5000 });
    await expect(page.locator(`#list-${id}`)).toContainText('Playwright 混排女');
  });

  test('代報名朋友（混排，男）', async ({ page }) => {
    const id = await openSignupModal(page, 'mixed', sessionId);
    if (!id) { test.skip(true, '找不到混排場次'); return; }

    await fillSignupForm(page, {
      name: 'Playwright 混排',
      gender: 'male',
      forFriend: true,
      friendName: '代報男朋友C',
      friendGender: 'male',
    });

    await expect(page.locator('#signupModal')).toBeHidden({ timeout: 5000 });
    await expect(page.locator(`#list-${id}`)).toContainText('代報男朋友C');
  });

  test('代報名朋友（混排，女）', async ({ page }) => {
    const id = await openSignupModal(page, 'mixed', sessionId);
    if (!id) { test.skip(true, '找不到混排場次'); return; }

    await fillSignupForm(page, {
      name: 'Playwright 混排',
      gender: 'male',
      forFriend: true,
      friendName: '代報女朋友D',
      friendGender: 'female',
    });

    await expect(page.locator('#signupModal')).toBeHidden({ timeout: 5000 });
    await expect(page.locator(`#list-${id}`)).toContainText('代報女朋友D');
  });

  test('混排場次有男女進度條', async ({ page }) => {
    await page.waitForSelector('#loadingSpinner', { state: 'hidden', timeout: 10000 });
    await page.click('#sg-mixed');
    await page.waitForTimeout(300);

    const maleBar = page.locator(`[id="prog-bar-male-${sessionId}"]`);
    const femaleBar = page.locator(`[id="prog-bar-female-${sessionId}"]`);
    if (!(await maleBar.count())) { test.skip(true, '找不到混排進度條'); return; }

    await expect(maleBar).toBeVisible();
    await expect(femaleBar).toBeVisible();
  });

  test('選攜帶器材後顯示在報名列表（混排場次）', async ({ page }) => {
    const id = await openSignupModal(page, 'mixed', sessionId);
    if (!id) { test.skip(true, '找不到混排場次'); return; }

    const bringRow = page.locator('#modalBringEquipRow');
    if (!(await bringRow.isVisible())) { test.skip(true, '此場次無器材需求'); return; }

    const chips = page.locator('#modalBringChips button');
    if (!(await chips.count())) { test.skip(true, '無器材 chip'); return; }

    await chips.first().click();
    await fillSignupForm(page, { name: 'Playwright 混排帶器材', gender: 'male' });

    await expect(page.locator('#signupModal')).toBeHidden({ timeout: 5000 });
    await expect(page.locator(`#list-${id}`)).toContainText('🎒');
  });
});
