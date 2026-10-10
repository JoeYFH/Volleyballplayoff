import { test, expect } from '@playwright/test';
import { setLangZh, loginAsTestUser } from '../helpers/auth.js';
import { fillSignupForm } from '../helpers/signup.js';
import { createTestSession, updateTestSession, deleteTestSession } from '../helpers/session.js';

test.describe.serial('分享頁面 /share/:id 與 /og/:id', () => {
  let sessionId;

  test.beforeAll(async () => {
    sessionId = await createTestSession('mixed');
    // 設定結束時間供時段顯示測試
    await updateTestSession(sessionId, { end_time: '21:00' });
    console.log(`\n🏐 分享頁面測試場次：${sessionId}`);
  });

  test.afterAll(async () => {
    await deleteTestSession(sessionId);
    console.log(`\n🗑️  刪除分享頁面測試場次：${sessionId}`);
  });

  async function waitForShareCard(page) {
    await page.locator('div.rounded-3xl').waitFor({ state: 'visible', timeout: 10000 });
    await page.locator('.animate-bounce').waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
    await expect(page.locator('text=/日期|Date/')).toBeVisible({ timeout: 10000 });
  }

  // ── 基本顯示 ────────────────────────────────────────────────

  test('正確顯示場次資訊', async ({ page }) => {
    await setLangZh(page);
    await page.goto(`/share/${sessionId}`);
    await waitForShareCard(page);

    await expect(page.locator('text=/時間|Time/')).toBeVisible();
    await expect(page.locator('text=/地點|Location/')).toBeVisible();
    await expect(page.locator('text=/開團人|Organizer/')).toBeVisible();
    await expect(page.locator('text=測試球館')).toBeVisible();
  });

  test('顯示正確的場次類型標籤', async ({ page }) => {
    await setLangZh(page);
    await page.goto(`/share/${sessionId}`);
    await waitForShareCard(page);

    await expect(page.locator('text=/混排|Mixed/')).toBeVisible();
  });

  test('/og/:id 路由也正確顯示場次資訊', async ({ page }) => {
    await setLangZh(page);
    await page.goto(`/og/${sessionId}`);
    await waitForShareCard(page);

    await expect(page.locator('text=測試球館')).toBeVisible();
    await expect(page.locator('text=/混排|Mixed/')).toBeVisible();
  });

  // ── 報名按鈕 ─────────────────────────────────────────────────

  test('報名開放時顯示「立即報名」按鈕', async ({ page }) => {
    await setLangZh(page);
    await page.goto(`/share/${sessionId}`);
    await waitForShareCard(page);

    await expect(page.locator('button:has-text("立即報名"), button:has-text("Sign Up Now")')).toBeVisible();
  });

  test('點擊「立即報名」會開啟報名 modal（需登入）', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto(`/share/${sessionId}`);
    await waitForShareCard(page);

    await page.locator('button:has-text("立即報名"), button:has-text("Sign Up Now")').click();
    await expect(page.locator('div.fixed.inset-0.z-40')).toBeVisible({ timeout: 8000 });
  });

  test('可以在分享頁面完成報名並顯示成功畫面（需登入）', async ({ page }) => {
    await loginAsTestUser(page);
    await setLangZh(page);
    await page.goto(`/share/${sessionId}`);
    await waitForShareCard(page);

    await page.locator('button:has-text("立即報名"), button:has-text("Sign Up Now")').click();
    await expect(page.locator('div.fixed.inset-0.z-40')).toBeVisible({ timeout: 8000 });

    await fillSignupForm(page, { gender: 'male' });

    // 成功畫面出現（modal 停在成功狀態，不自動關閉）
    const modal = page.locator('div.fixed.inset-0.z-40');
    await expect(
      modal.locator('text=報名成功！').or(modal.locator('text=Signed up!'))
    ).toBeVisible({ timeout: 10000 });
  });

  test('報名成功後顯示正取或候補狀態', async ({ page }) => {
    await loginAsTestUser(page);
    await setLangZh(page);
    await page.goto(`/share/${sessionId}`);
    await waitForShareCard(page);

    await page.locator('button:has-text("立即報名"), button:has-text("Sign Up Now")').click();
    await expect(page.locator('div.fixed.inset-0.z-40')).toBeVisible({ timeout: 8000 });

    await fillSignupForm(page, { gender: 'male' });

    const modal = page.locator('div.fixed.inset-0.z-40');
    await expect(
      modal.locator('text=報名成功！').or(modal.locator('text=Signed up!'))
    ).toBeVisible({ timeout: 10000 });

    // 應顯示正取或候補狀態 badge
    await expect(
      modal.locator('text=正取').or(modal.locator('text=候補'))
        .or(modal.locator('text=Confirmed')).or(modal.locator('text=Waitlisted'))
    ).toBeVisible({ timeout: 5000 });
  });

  test('報名成功畫面有「回到首頁」按鈕', async ({ page }) => {
    await loginAsTestUser(page);
    await setLangZh(page);
    await page.goto(`/share/${sessionId}`);
    await waitForShareCard(page);

    await page.locator('button:has-text("立即報名"), button:has-text("Sign Up Now")').click();
    await expect(page.locator('div.fixed.inset-0.z-40')).toBeVisible({ timeout: 8000 });

    await fillSignupForm(page, { gender: 'female' });

    const modal = page.locator('div.fixed.inset-0.z-40');
    await expect(
      modal.locator('text=報名成功！').or(modal.locator('text=Signed up!'))
    ).toBeVisible({ timeout: 10000 });

    // 有「回到首頁」按鈕
    await expect(
      modal.locator('button:has-text("回到首頁")').or(modal.locator('button:has-text("Back to Home")'))
    ).toBeVisible({ timeout: 3000 });
  });

  // ── 錯誤與導航 ───────────────────────────────────────────────

  test('無效的 session id 顯示錯誤狀態', async ({ page }) => {
    await setLangZh(page);
    await page.goto('/share/invalid-session-id-00000000');
    await page.locator('div.rounded-3xl').waitFor({ state: 'visible', timeout: 10000 });
    await page.locator('.animate-bounce').waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});

    await expect(page.locator('text=/找不到此活動|Session not found/')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('a[href="/"]')).toBeVisible();
  });

  test('回首頁連結可用', async ({ page }) => {
    await setLangZh(page);
    await page.goto(`/share/${sessionId}`);
    await waitForShareCard(page);

    await page.locator('a[href="/"]').first().click();
    await expect(page).toHaveURL(/\/$|\/\?/, { timeout: 5000 });
  });

  // ── 結束時間 & 時長顯示 ────────────────────────────────────

  test('有設定結束時間時，時間欄位顯示結束時間', async ({ page }) => {
    await setLangZh(page);
    await page.goto(`/share/${sessionId}`);
    await waitForShareCard(page);

    // 應顯示「開始 – 結束」格式
    await expect(page.locator('text=/19:00.*–.*21:00|21:00/')).toBeVisible({ timeout: 5000 });
  });

  test('有設定結束時間時，顯示時長 pill（⏱）', async ({ page }) => {
    await setLangZh(page);
    await page.goto(`/share/${sessionId}`);
    await waitForShareCard(page);

    // 應出現 ⏱ 時長標籤（2 小時）
    await expect(page.locator('text=/⏱|小時/')).toBeVisible({ timeout: 5000 });
  });

  // ── 地點 Google Maps 連結 ─────────────────────────────────

  test('地點顯示為可點擊的 Google Maps 連結', async ({ page }) => {
    await setLangZh(page);
    await page.goto(`/share/${sessionId}`);
    await waitForShareCard(page);

    // 地點應為 <a> 連結，href 指向 google.com/maps
    const locationLink = page.locator('a[href*="google.com/maps"]').first();
    await expect(locationLink).toBeVisible({ timeout: 5000 });
    await expect(locationLink).toContainText('測試球館');
  });

  test('地點連結包含正確的查詢參數（場地名稱）', async ({ page }) => {
    await setLangZh(page);
    await page.goto(`/share/${sessionId}`);
    await waitForShareCard(page);

    const href = await page.locator('a[href*="google.com/maps"]').first().getAttribute('href');
    expect(href).toContain('測試球館');
  });

  // ── 報名成功畫面不自動關閉 ───────────────────────────────

  test('報名送出後 modal 保持開啟並顯示成功標題', async ({ page }) => {
    await loginAsTestUser(page);
    await setLangZh(page);
    await page.goto(`/share/${sessionId}`);
    await waitForShareCard(page);

    await page.locator('button:has-text("立即報名"), button:has-text("Sign Up Now")').click();
    await expect(page.locator('div.fixed.inset-0.z-40')).toBeVisible({ timeout: 8000 });

    await fillSignupForm(page, { gender: 'male' });

    // Modal 應仍可見（不自動關閉）
    const modal = page.locator('div.fixed.inset-0.z-40');
    await expect(modal).toBeVisible({ timeout: 8000 });
    await expect(
      modal.locator('text=報名成功！').or(modal.locator('text=Signed up!'))
    ).toBeVisible({ timeout: 10000 });
  });

  test('成功畫面有正取或候補 badge', async ({ page }) => {
    await loginAsTestUser(page);
    await setLangZh(page);
    await page.goto(`/share/${sessionId}`);
    await waitForShareCard(page);

    await page.locator('button:has-text("立即報名"), button:has-text("Sign Up Now")').click();
    await expect(page.locator('div.fixed.inset-0.z-40')).toBeVisible({ timeout: 8000 });

    await fillSignupForm(page, { gender: 'female' });

    const modal = page.locator('div.fixed.inset-0.z-40');
    await expect(
      modal.locator('text=報名成功！').or(modal.locator('text=Signed up!'))
    ).toBeVisible({ timeout: 10000 });

    await expect(
      modal.locator('text=正取').or(modal.locator('text=候補'))
        .or(modal.locator('text=Confirmed')).or(modal.locator('text=Waitlisted'))
    ).toBeVisible({ timeout: 5000 });
  });

  test('成功畫面有「回到首頁」和「關閉」按鈕', async ({ page }) => {
    await loginAsTestUser(page);
    await setLangZh(page);
    await page.goto(`/share/${sessionId}`);
    await waitForShareCard(page);

    await page.locator('button:has-text("立即報名"), button:has-text("Sign Up Now")').click();
    await expect(page.locator('div.fixed.inset-0.z-40')).toBeVisible({ timeout: 8000 });

    await fillSignupForm(page, { gender: 'male' });

    const modal = page.locator('div.fixed.inset-0.z-40');
    await expect(
      modal.locator('text=報名成功！').or(modal.locator('text=Signed up!'))
    ).toBeVisible({ timeout: 10000 });

    await expect(
      modal.locator('button:has-text("回到首頁")').or(modal.locator('button:has-text("Back to Home")'))
    ).toBeVisible();
    await expect(
      modal.locator('button:has-text("關閉")').or(modal.locator('button:has-text("Close")'))
    ).toBeVisible();
  });
});
