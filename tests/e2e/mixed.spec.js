import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../helpers/auth.js';
import { createTestSession, deleteTestSession, updateTestSession } from '../helpers/session.js';
import { openSignupModal, fillSignupForm, clickStatusFilter, clickGenderFilter } from '../helpers/signup.js';

// ────────────────────────────────────────────────────────────
// 測試 1：建立混排場次後，按鈕正常且候補功能正確
// ────────────────────────────────────────────────────────────
test.describe.serial('混排場次 — 候補測試', () => {
  let sessionId;

  test.beforeAll(async () => {
    // 建立混排場次，男女各限 1 人，方便快速觸發候補
    sessionId = await createTestSession('mixed', { maleLimit: 1, femaleLimit: 1, limitTotal: 2 });
    console.log(`\n🏐 混排測試場次（候補）：${sessionId}`);
  });

  test.afterAll(async () => {
    await deleteTestSession(sessionId);
    console.log(`\n🗑️  刪除混排場次（候補）：${sessionId}`);
  });

  test('場次卡片顯示在首頁並含正確資訊', async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
    await page.waitForLoadState('networkidle');

    await clickStatusFilter(page, '所有');
    await clickGenderFilter(page, '⚥ 混排');

    const card = page.locator(`#card-${sessionId}`);
    await expect(card).toBeVisible({ timeout: 10000 });
    await expect(card).toContainText('測試球館');
    await expect(card).toContainText('場館一樓大廳集合');
  });

  test('場次卡片有「我要報名」按鈕', async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
    await page.waitForLoadState('networkidle');

    await clickStatusFilter(page, '所有');
    await clickGenderFilter(page, '⚥ 混排');

    const card = page.locator(`#card-${sessionId}`);
    await expect(card).toBeVisible({ timeout: 10000 });
    await expect(card.locator('button:has-text("我要報名"), button:has-text("Sign Up")')).toBeVisible();
  });

  test('場次卡片有「分享連結」按鈕', async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
    await page.waitForLoadState('networkidle');

    await clickStatusFilter(page, '所有');
    await clickGenderFilter(page, '⚥ 混排');

    const card = page.locator(`#card-${sessionId}`);
    await expect(card).toBeVisible({ timeout: 10000 });
    await expect(card.locator('button:has-text("分享"), button:has-text("Share")')).toBeVisible();
  });

  test('報名男生（第 1 名，確認）', async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
    await page.waitForLoadState('networkidle');

    await clickStatusFilter(page, '所有');
    await clickGenderFilter(page, '⚥ 混排');

    await openSignupModal(page, sessionId);
    await fillSignupForm(page, { forFriend: true, friendName: '測試男生甲', friendGender: 'male' });

    // modal 應關閉
    await expect(page.locator('div.fixed.inset-0.z-40')).toBeHidden({ timeout: 8000 });

    // 名單應包含報名者
    await expect(page.locator(`#list-${sessionId}`)).toContainText('測試男生甲', { timeout: 5000 });
  });

  test('報名第 2 位男生（超額→候補）', async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
    await page.waitForLoadState('networkidle');

    await clickStatusFilter(page, '所有');
    await clickGenderFilter(page, '⚥ 混排');

    await openSignupModal(page, sessionId);
    await fillSignupForm(page, { forFriend: true, friendName: '測試男生乙', friendGender: 'male' });

    await expect(page.locator('div.fixed.inset-0.z-40')).toBeHidden({ timeout: 8000 });
    await expect(page.locator(`#list-${sessionId}`)).toContainText('測試男生乙', { timeout: 5000 });
  });

  test('名單出現候補標示（男額滿）', async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
    await page.waitForLoadState('networkidle');

    await clickStatusFilter(page, '所有');
    await clickGenderFilter(page, '⚥ 混排');

    const list = page.locator(`#list-${sessionId}`);
    await expect(list).toBeVisible({ timeout: 10000 });
    // 候補標示：「候」字 或 waitlist 相關文字
    await expect(list).toContainText(/候|Waitlist|waitlist/, { timeout: 5000 });
  });

  test('男女進度條都存在', async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
    await page.waitForLoadState('networkidle');

    await clickStatusFilter(page, '所有');
    await clickGenderFilter(page, '⚥ 混排');

    const card = page.locator(`#card-${sessionId}`);
    await expect(card).toBeVisible({ timeout: 10000 });

    // 混排進度條應有 ♂ 和 ♀ 標示
    await expect(card.locator('text=♂')).toBeVisible();
    await expect(card.locator('text=♀')).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────
// 測試 2：暫停報名後，主頁看不到但直接連結可瀏覽
// ────────────────────────────────────────────────────────────
test.describe.serial('混排場次 — 暫停報名測試', () => {
  let sessionId;

  test.beforeAll(async () => {
    sessionId = await createTestSession('mixed', { maleLimit: 6, femaleLimit: 6 });
    console.log(`\n🏐 混排測試場次（暫停）：${sessionId}`);
  });

  test.afterAll(async () => {
    await deleteTestSession(sessionId);
    console.log(`\n🗑️  刪除混排場次（暫停）：${sessionId}`);
  });

  test('場次開放時顯示在「報名中」tab', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 預設 tab 是「報名中」
    const card = page.locator(`#card-${sessionId}`);
    await expect(card).toBeVisible({ timeout: 10000 });
    await expect(card.locator('button:has-text("我要報名"), button:has-text("Sign Up")')).toBeVisible();
  });

  test('暫停後場次從「報名中」tab 消失', async ({ page }) => {
    // 透過 API 暫停報名
    await updateTestSession(sessionId, { is_open: false });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 「報名中」filter（預設），場次卡片不應出現
    const card = page.locator(`#card-${sessionId}`);
    await expect(card).toBeHidden({ timeout: 5000 });
  });

  test('直接連結仍可瀏覽場次（卡片可見）', async ({ page }) => {
    await page.goto(`/?session=${sessionId}`);
    await page.waitForLoadState('networkidle');

    // 切到「所有」才能看到已關閉場次
    await clickStatusFilter(page, '所有');

    const card = page.locator(`#card-${sessionId}`);
    await expect(card).toBeVisible({ timeout: 10000 });

    // 場次狀態為「已截止/Closed」，無「我要報名」按鈕
    await expect(card.locator('button:has-text("我要報名"), button:has-text("Sign Up")')).toBeHidden();
  });

  test('重新開放後，報名按鈕恢復', async ({ page }) => {
    await updateTestSession(sessionId, { is_open: true });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 「報名中」tab 應看到場次
    const card = page.locator(`#card-${sessionId}`);
    await expect(card).toBeVisible({ timeout: 10000 });
    await expect(card.locator('button:has-text("我要報名"), button:has-text("Sign Up")')).toBeVisible();
  });
});
