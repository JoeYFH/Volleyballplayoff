/**
 * 測試：意見回饋的篩選、排序、狀態管理與多選批次操作
 * 需要 admin 帳號才能讀取 feedback（RLS 限制）
 * 若測試帳號非 admin，feedback 區塊不會顯示，測試會自動跳過
 */
import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../helpers/auth.js';
import { createTestFeedback, deleteTestFeedbacks } from '../helpers/session.js';

test.describe.serial('意見回饋管理（Admin）', () => {
  const feedbackIds = [];

  test.beforeAll(async () => {
    // 建立 3 筆不同狀態的測試回饋
    const id1 = await createTestFeedback('[自動測試] 待處理回饋', { type: 'bug', urgency: 'high', status: 'pending' });
    const id2 = await createTestFeedback('[自動測試] 處理中回饋', { type: 'idea', urgency: 'medium', status: 'in_progress' });
    const id3 = await createTestFeedback('[自動測試] 已處理回饋', { type: 'other', urgency: 'low', status: 'done' });
    feedbackIds.push(id1, id2, id3);
    console.log(`\n💬 測試回饋 ids: ${feedbackIds.join(', ')}`);
  });

  test.afterAll(async () => {
    await deleteTestFeedbacks(feedbackIds);
    console.log(`\n🗑️  刪除測試回饋: ${feedbackIds.join(', ')}`);
  });

  async function goToFeedbackSection(page) {
    await loginAsTestUser(page);
    await page.goto('/my-sessions');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("我的開場"), h1:has-text("My Sessions")')).toBeVisible({ timeout: 10000 });

    // 等待可能的 loading
    await page.locator('.animate-bounce').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1000);

    // 確認意見回饋區塊存在（admin 才看得到）
    const feedbackSection = page.locator('text=/意見回覆|Feedback/').first();
    const isVisible = await feedbackSection.isVisible({ timeout: 5000 }).catch(() => false);
    return isVisible;
  }

  // ── 篩選 tab ─────────────────────────────────────────────────

  test('意見回饋區塊顯示篩選 tab', async ({ page }) => {
    const visible = await goToFeedbackSection(page);
    test.skip(!visible, '非 admin 帳號，跳過 feedback 測試');

    await expect(page.locator('button:has-text("尚未處理"), button:has-text("Pending")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("處理中"), button:has-text("In Progress")')).toBeVisible();
    await expect(page.locator('button:has-text("已處理"), button:has-text("Done")')).toBeVisible();
    await expect(page.locator('button:has-text("全部"), button:has-text("All")')).toBeVisible();
  });

  test('切換到「全部」tab 顯示所有測試回饋', async ({ page }) => {
    const visible = await goToFeedbackSection(page);
    test.skip(!visible, '非 admin 帳號，跳過 feedback 測試');

    await page.locator('button:has-text("全部"), button:has-text("All")').last().click();
    await page.waitForTimeout(500);

    await expect(page.locator('text=[自動測試] 待處理回饋')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=[自動測試] 處理中回饋')).toBeVisible();
    await expect(page.locator('text=[自動測試] 已處理回饋')).toBeVisible();
  });

  test('切換到「尚未處理」tab 只顯示待處理回饋', async ({ page }) => {
    const visible = await goToFeedbackSection(page);
    test.skip(!visible, '非 admin 帳號，跳過 feedback 測試');

    await page.locator('button:has-text("全部"), button:has-text("All")').last().click();
    await page.waitForTimeout(300);
    await page.locator('button:has-text("尚未處理"), button:has-text("Pending")').last().click();
    await page.waitForTimeout(500);

    await expect(page.locator('text=[自動測試] 待處理回饋')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=[自動測試] 處理中回饋')).toBeHidden();
  });

  // ── 排序 ─────────────────────────────────────────────────────

  test('排序下拉選單可切換', async ({ page }) => {
    const visible = await goToFeedbackSection(page);
    test.skip(!visible, '非 admin 帳號，跳過 feedback 測試');

    const sortSelect = page.locator('select').last();
    await expect(sortSelect).toBeVisible({ timeout: 5000 });

    await sortSelect.selectOption('urgency');
    await page.waitForTimeout(300);
    const val = await sortSelect.inputValue();
    expect(val).toBe('urgency');
  });

  // ── 單筆狀態變更 ─────────────────────────────────────────────

  test('可以將單筆回饋標記為「處理中」', async ({ page }) => {
    const visible = await goToFeedbackSection(page);
    test.skip(!visible, '非 admin 帳號，跳過 feedback 測試');

    await page.locator('button:has-text("全部"), button:has-text("All")').last().click();
    await page.waitForTimeout(500);

    // 找到待處理回饋，點「處理中」按鈕
    const pendingCard = page.locator('div.bg-white.rounded-xl').filter({ hasText: '[自動測試] 待處理回饋' }).first();
    await expect(pendingCard).toBeVisible({ timeout: 8000 });

    const inProgressBtn = pendingCard.locator('button:has-text("處理中"), button:has-text("In Progress")').first();
    if (await inProgressBtn.isVisible()) {
      await inProgressBtn.click();
      await page.waitForTimeout(500);
      // 狀態 badge 應更新
      await expect(pendingCard.locator('text=/處理中|In Progress/')).toBeVisible({ timeout: 5000 });
    }
  });

  // ── 多選功能 ─────────────────────────────────────────────────

  test('勾選 checkbox 出現多選操作列', async ({ page }) => {
    const visible = await goToFeedbackSection(page);
    test.skip(!visible, '非 admin 帳號，跳過 feedback 測試');

    await page.locator('button:has-text("全部"), button:has-text("All")').last().click();
    await page.waitForTimeout(500);

    // 勾選第一筆
    const firstCard = page.locator('div.bg-white.rounded-xl').filter({ hasText: '[自動測試]' }).first();
    await expect(firstCard).toBeVisible({ timeout: 8000 });
    await firstCard.locator('input[type="checkbox"]').check();

    // 多選操作列應出現（indigo 背景）
    await expect(page.locator('div.bg-indigo-600')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=/已選 1 筆|1 selected/')).toBeVisible();
  });

  test('多選後可批次移動狀態', async ({ page }) => {
    const visible = await goToFeedbackSection(page);
    test.skip(!visible, '非 admin 帳號，跳過 feedback 測試');

    await page.locator('button:has-text("全部"), button:has-text("All")').last().click();
    await page.waitForTimeout(500);

    // 勾選兩筆
    const cards = page.locator('div.bg-white.rounded-xl').filter({ hasText: '[自動測試]' });
    const count = await cards.count();
    if (count < 2) {
      test.skip(true, '回饋數量不足，跳過多選測試');
      return;
    }
    await cards.nth(0).locator('input[type="checkbox"]').check();
    await cards.nth(1).locator('input[type="checkbox"]').check();

    await expect(page.locator('text=/已選 2 筆|2 selected/')).toBeVisible({ timeout: 3000 });

    // 批次設為「已處理」
    const bulkBar = page.locator('div.bg-indigo-600');
    await bulkBar.locator('button:has-text("已處理"), button:has-text("Done")').click();
    await page.waitForTimeout(500);

    // 操作列應消失（選取清除）
    await expect(page.locator('text=/已選 2 筆|2 selected/')).toBeHidden({ timeout: 5000 });
  });

  test('多選後可批次刪除', async ({ page }) => {
    const visible = await goToFeedbackSection(page);
    test.skip(!visible, '非 admin 帳號，跳過 feedback 測試');

    await page.locator('button:has-text("全部"), button:has-text("All")').last().click();
    await page.waitForTimeout(500);

    // 如果有測試資料存在則勾選並刪除
    const cards = page.locator('div.bg-white.rounded-xl').filter({ hasText: '[自動測試] 已處理回饋' });
    const count = await cards.count();
    if (count === 0) {
      test.skip(true, '找不到測試回饋，跳過刪除測試');
      return;
    }

    await cards.first().locator('input[type="checkbox"]').check();
    await expect(page.locator('div.bg-indigo-600')).toBeVisible({ timeout: 3000 });

    // 攔截 confirm 對話框
    page.once('dialog', d => d.accept());
    await page.locator('div.bg-indigo-600 button:has-text("🗑️")').click();
    await page.waitForTimeout(800);

    // 操作列應消失
    await expect(page.locator('div.bg-indigo-600')).toBeHidden({ timeout: 5000 });

    // feedbackIds 中已刪除的 id 從清理列表移除（Playwright 無 DB 存取，僅由 afterAll cleanup 補刪）
  });

  test('點擊「✕」可清除所有選取', async ({ page }) => {
    const visible = await goToFeedbackSection(page);
    test.skip(!visible, '非 admin 帳號，跳過 feedback 測試');

    await page.locator('button:has-text("全部"), button:has-text("All")').last().click();
    await page.waitForTimeout(500);

    const cards = page.locator('div.bg-white.rounded-xl').filter({ hasText: '[自動測試]' });
    const count = await cards.count();
    if (count === 0) return;

    await cards.first().locator('input[type="checkbox"]').check();
    await expect(page.locator('div.bg-indigo-600')).toBeVisible({ timeout: 3000 });

    // 點 ✕ 清除選取
    await page.locator('div.bg-indigo-600 button:has-text("✕")').click();
    await expect(page.locator('div.bg-indigo-600')).toBeHidden({ timeout: 3000 });
  });
});
