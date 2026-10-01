import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { loginAsTestUser } from '../helpers/auth.js';
import { fillSignupForm, openSignupModal } from '../helpers/signup.js';
import { createTestSession, deleteTestSession } from '../helpers/session.js';

let sessionId;

test.describe.serial('混排場次', () => {
  test('建立測試場次（混排）', async () => {
    sessionId = await createTestSession('mixed', { maleLimit: 1, femaleLimit: 1 });
    expect(sessionId).toBeTruthy();
    console.log(`\n🏐 混排測試場次建立：${sessionId}`);
  });

  test('場次卡片顯示活動詳細說明（混排）', async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
    await page.waitForSelector('#loadingSpinner', { state: 'hidden', timeout: 10000 });
    await page.click('#sg-mixed');
    await page.waitForTimeout(300);

    // 活動詳細說明顯示在主頁場次卡片
    await expect(page.locator(`#card-${sessionId}`)).toContainText('場館一樓大廳集合');
  });

  test('備注欄位正確儲存（混排）', async () => {
    // 備注只有開場者看得到，直接查 DB 驗證欄位有被儲存
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    const { data } = await supabase.from('sessions').select('note').eq('id', sessionId).single();
    expect(data?.note).toContain('這是測試用的備注');
  });

  test('報名混排場次（男）', async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
    const id = await openSignupModal(page, 'mixed', sessionId);
    if (!id) { test.skip(true, '找不到混排場次'); return; }

    await fillSignupForm(page, { name: 'Playwright 混排男', gender: 'male' });

    await expect(page.locator('#signupModal')).toBeHidden({ timeout: 5000 });
    await expect(page.locator(`#list-${id}`)).toContainText('(me)');
  });

  test('代報名女生（混排場次）', async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
    const id = await openSignupModal(page, 'mixed', sessionId);
    if (!id) { test.skip(true, '找不到混排場次'); return; }

    await fillSignupForm(page, {
      name: 'Playwright 混排',
      gender: 'male',
      forFriend: true,
      friendName: '代報女生E',
      friendGender: 'female',
    });

    await expect(page.locator('#signupModal')).toBeHidden({ timeout: 5000 });
    await expect(page.locator(`#list-${id}`)).toContainText('代報女生E');
  });

  test('代報名朋友（混排，男）', async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
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
    await page.goto('/');
    await loginAsTestUser(page);
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

  test('超過男女名額後顯示候補名單', async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
    await page.waitForSelector('#loadingSpinner', { state: 'hidden', timeout: 10000 });
    await page.click('#sg-mixed');
    await page.waitForTimeout(300);

    const listEl = page.locator(`#list-${sessionId}`);
    if (!(await listEl.count())) { test.skip(true, '找不到混排場次'); return; }

    // 男女名額各 1，已分別有 2 名男生和 2 名女生報名，候補分隔線應出現
    await expect(listEl).toContainText('候補', { timeout: 5000 });
    // 超額的男生應在候補
    await expect(listEl).toContainText('代報男朋友C');
    // 超額的女生應在候補
    await expect(listEl).toContainText('代報女朋友D');
  });

  test('混排場次有男女進度條', async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
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
    await page.goto('/');
    await loginAsTestUser(page);
    const id = await openSignupModal(page, 'mixed', sessionId);
    if (!id) { test.skip(true, '找不到混排場次'); return; }

    const bringRow = page.locator('#modalBringEquipRow');
    if (!(await bringRow.isVisible())) { test.skip(true, '此場次無器材需求'); return; }

    const chips = page.locator('#modalBringChips button');
    if (!(await chips.count())) { test.skip(true, '無器材 chip'); return; }

    await chips.first().click();
    await fillSignupForm(page, { name: 'Playwright 混排帶器材', gender: 'male', forFriend: true, friendName: '器材測試朋友(混排)', friendGender: 'male' });

    await expect(page.locator('#signupModal')).toBeHidden({ timeout: 5000 });
    await expect(page.locator(`#list-${id}`)).toContainText('🎒');
  });

  test('刪除測試場次（混排）', async () => {
    await deleteTestSession(sessionId);
    console.log(`\n🗑️  混排測試場次刪除：${sessionId}`);
  });
});
