import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../helpers/auth.js';
import { createTestSession, deleteTestSession, updateTestSession } from '../helpers/session.js';
import { openSignupModal, fillSignupForm, clickStatusFilter, clickGenderFilter } from '../helpers/signup.js';

test.describe.serial('混排場次', () => {
  let sessionId;

  test.beforeAll(async () => {
    // 男女各限 1 人，方便快速觸發候補；暫停測試也用同一場次
    sessionId = await createTestSession('mixed', { maleLimit: 1, femaleLimit: 1, limitTotal: 2 });
    console.log(`\n🏐 混排測試場次：${sessionId}`);
  });

  test.afterAll(async () => {
    await deleteTestSession(sessionId);
    console.log(`\n🗑️  刪除混排場次：${sessionId}`);
  });

  // ── 基本顯示 ──────────────────────────────────────────────

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

  test('場次卡片有「我要報名」和「分享」按鈕', async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
    await page.waitForLoadState('networkidle');

    await clickStatusFilter(page, '所有');
    await clickGenderFilter(page, '⚥ 混排');

    const card = page.locator(`#card-${sessionId}`);
    await expect(card).toBeVisible({ timeout: 10000 });
    await expect(card.locator('button:has-text("我要報名"), button:has-text("Sign Up")')).toBeVisible();
    await expect(card.locator('button:has-text("分享"), button:has-text("Share")')).toBeVisible();
  });

  test('男女進度條都存在', async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
    await page.waitForLoadState('networkidle');

    await clickStatusFilter(page, '所有');
    await clickGenderFilter(page, '⚥ 混排');

    const card = page.locator(`#card-${sessionId}`);
    await expect(card).toBeVisible({ timeout: 10000 });
    await expect(card.locator('text=♂')).toBeVisible();
    await expect(card.locator('text=♀')).toBeVisible();
  });

  // ── 候補功能 ──────────────────────────────────────────────

  test('報名第 1 位男生（確認）', async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
    await page.waitForLoadState('networkidle');

    await clickStatusFilter(page, '所有');
    await clickGenderFilter(page, '⚥ 混排');

    await openSignupModal(page, sessionId);
    await fillSignupForm(page, { forFriend: true, friendName: '測試男生甲', friendGender: 'male' });

    await expect(page.locator('div.fixed.inset-0.z-40')).toBeHidden({ timeout: 8000 });
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
    await expect(list).toContainText(/候|Waitlist/, { timeout: 5000 });
  });

  // ── 暫停報名 ──────────────────────────────────────────────

  test('暫停後場次從「報名中」tab 消失', async ({ page }) => {
    await updateTestSession(sessionId, { is_open: false });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 預設「報名中」filter，已暫停的場次不應出現
    await expect(page.locator(`#card-${sessionId}`)).toBeHidden({ timeout: 5000 });
  });

  test('直接連結仍可瀏覽場次（卡片可見）', async ({ page }) => {
    await page.goto(`/?session=${sessionId}`);
    await page.waitForLoadState('networkidle');

    await clickStatusFilter(page, '所有');

    const card = page.locator(`#card-${sessionId}`);
    await expect(card).toBeVisible({ timeout: 10000 });
    // 已暫停，無「我要報名」按鈕
    await expect(card.locator('button:has-text("我要報名"), button:has-text("Sign Up")')).toBeHidden();
  });

  test('重新開放後報名按鈕恢復', async ({ page }) => {
    await updateTestSession(sessionId, { is_open: true });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const card = page.locator(`#card-${sessionId}`);
    await expect(card).toBeVisible({ timeout: 10000 });
    await expect(card.locator('button:has-text("我要報名"), button:has-text("Sign Up")')).toBeVisible();
  });
});
