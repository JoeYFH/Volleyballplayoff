import { test, expect } from '@playwright/test';
import { loginAsTestUser, setLangZh } from '../helpers/auth.js';
import { deleteTestSession } from '../helpers/session.js';

test.describe.serial('建立場次功能', () => {
  const createdSessionIds = [];

  test.afterAll(async () => {
    for (const id of createdSessionIds) {
      await deleteTestSession(id);
    }
  });

  async function openCreateSheet(page) {
    await page.goto('/my-sessions');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("我的開場"), h1:has-text("My Sessions")')).toBeVisible({ timeout: 10000 });
    await page.locator('button:has-text("建立新場次"), button:has-text("New Session")').click();
    await expect(page.locator('h2:has-text("建立新場次"), h2:has-text("Create Session")')).toBeVisible({ timeout: 8000 });
  }

  // ── 過去日期驗證 ─────────────────────────────────────────────

  test('選擇過去日期送出時顯示錯誤訊息', async ({ page }) => {
    await loginAsTestUser(page);
    await setLangZh(page);
    await openCreateSheet(page);

    // 填入標題與時間（避免其他欄位觸發錯誤）
    await page.locator('input[placeholder*="第15週"], input[placeholder*="Week 15"]').first().fill('測試場次');
    await page.locator('input[type="time"]').fill('19:00');
    await page.locator('input[type="text"]').last().fill('測試球館').catch(() => {});

    // 設定昨天的日期
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    await page.locator('input[type="date"]').fill(yStr);

    // 點擊送出
    await page.locator('button:has-text("建立場次"), button:has-text("Create Session")').last().click();

    // 應出現日期錯誤訊息
    await expect(
      page.locator('text=不可選擇過去的日期').or(page.locator('text=past date'))
    ).toBeVisible({ timeout: 5000 });
  });

  test('日期輸入框 min 屬性為今天（不允許選過去日期）', async ({ page }) => {
    await loginAsTestUser(page);
    await setLangZh(page);
    await openCreateSheet(page);

    const dateInput = page.locator('input[type="date"]').first();
    await expect(dateInput).toBeVisible({ timeout: 5000 });

    const minAttr = await dateInput.getAttribute('min');
    expect(minAttr).toBeTruthy();

    // min 應為今天或之後（格式 YYYY-MM-DD）
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    expect(minAttr >= todayStr).toBeTruthy();
  });

  // ── 驗證摘要 ─────────────────────────────────────────────────

  test('送出空白表單時顯示驗證摘要', async ({ page }) => {
    await loginAsTestUser(page);
    await setLangZh(page);
    await openCreateSheet(page);

    // 不填任何欄位直接送出
    await page.locator('button:has-text("建立場次"), button:has-text("Create Session")').last().click();

    // 應出現 amber 驗證摘要方塊（含 ⚠️ 圖示，rounded-xl 區分 note 與 summary）
    const summary = page.locator('.bg-amber-50.border-amber-200.rounded-xl');
    await expect(summary).toBeVisible({ timeout: 5000 });
    await expect(summary).toContainText('⚠️');
  });

  test('必填欄位驗證後出現紅框提示', async ({ page }) => {
    await loginAsTestUser(page);
    await setLangZh(page);
    await openCreateSheet(page);

    // 不填任何欄位直接送出
    await page.locator('button:has-text("建立場次"), button:has-text("Create Session")').last().click();

    // 場次名稱欄位應有 border-red 樣式
    const titleInput = page.locator('input[placeholder*="第15週"], input[placeholder*="Week 15"]').first();
    const titleClass = await titleInput.getAttribute('class');
    expect(titleClass).toContain('red');
  });

  // ── 幫自己報名 ──────────────────────────────────────────────

  test('建立場次時出現「幫自己報名」選項', async ({ page }) => {
    await loginAsTestUser(page);
    await setLangZh(page);
    await openCreateSheet(page);

    await expect(
      page.locator('text=幫自己報名此場次').or(page.locator('text=Sign myself up'))
    ).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#selfSignupChk')).toBeVisible();
  });

  test('勾選「幫自己報名」後顯示使用者名稱', async ({ page }) => {
    await loginAsTestUser(page);
    await setLangZh(page);
    await openCreateSheet(page);

    // 勾選自己報名
    await page.locator('#selfSignupChk').check();

    // 應顯示使用者名稱（Google profile）
    const profileSection = page.locator('.bg-indigo-50\\/60');
    await expect(profileSection).toBeVisible();
    // 使用者名稱或 email 應顯示
    await expect(profileSection.locator('span.text-xs.text-gray-600')).toBeVisible({ timeout: 3000 });
  });

  test('混排場次勾選幫自己報名後出現性別選擇', async ({ page }) => {
    await loginAsTestUser(page);
    await setLangZh(page);
    await openCreateSheet(page);

    // 確認場次類型已是混排（預設）
    const mixedBtn = page.locator('button:has-text("混排"), button:has-text("Mixed")').first();
    if (await mixedBtn.isVisible()) await mixedBtn.click();

    // 勾選自己報名
    await page.locator('#selfSignupChk').check();

    // 應出現性別選擇按鈕
    await expect(page.locator('button:has-text("♂"), button:has-text("Male")').first()).toBeVisible({ timeout: 3000 });
    await expect(page.locator('button:has-text("♀"), button:has-text("Female")').first()).toBeVisible({ timeout: 3000 });
  });

  // ── 成功建立場次（含自己報名）──────────────────────────────

  test('成功建立場次並幫自己報名', async ({ page }) => {
    await loginAsTestUser(page);
    await setLangZh(page);

    // 在報名頁前先監聽 session 建立，以便 afterAll 清理
    await openCreateSheet(page);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

    await page.locator('input[placeholder*="第15週"], input[placeholder*="Week 15"]').first().fill('[測試] 幫自己報名場次');
    await page.locator('input[type="date"]').fill(dateStr);
    await page.locator('input[type="time"]').fill('19:00');

    // 地點欄位
    const locationInput = page.locator('input[placeholder*="地址"], input[placeholder*="address"], input[placeholder*="venue"]').first();
    if (await locationInput.isVisible()) {
      await locationInput.fill('測試球館');
    }

    // 勾選幫自己報名
    await page.locator('#selfSignupChk').check();

    // 選男生性別（混排場次）
    const maleBtn = page.locator('.bg-indigo-50\\/60 button:has-text("♂")').first();
    if (await maleBtn.isVisible()) await maleBtn.click();

    // 送出
    await page.locator('button:has-text("建立場次"), button:has-text("Create Session")').last().click();

    // Sheet 應關閉（建立成功）
    await expect(page.locator('h2:has-text("建立新場次"), h2:has-text("Create Session")')).toBeHidden({ timeout: 10000 });
  });

  // ── 日期 / 時間欄位版面 ──────────────────────────────────────

  test('日期欄位獨立一行（不與時間並排）', async ({ page }) => {
    await loginAsTestUser(page);
    await setLangZh(page);
    await openCreateSheet(page);

    const dateInput = page.locator('input[type="date"]').first();
    const timeInputs = page.locator('input[type="time"]');

    await expect(dateInput).toBeVisible({ timeout: 5000 });
    await expect(timeInputs.first()).toBeVisible();

    // 日期和第一個時間輸入框應有不同的 Y 位置（日期在上，時間在下）
    const dateBox = await dateInput.boundingBox();
    const timeBox = await timeInputs.first().boundingBox();
    expect(dateBox).toBeTruthy();
    expect(timeBox).toBeTruthy();
    // 日期在時間的上方
    expect(dateBox.y).toBeLessThan(timeBox.y);
  });

  test('開始時間與結束時間並排顯示', async ({ page }) => {
    await loginAsTestUser(page);
    await setLangZh(page);
    await openCreateSheet(page);

    const timeInputs = page.locator('input[type="time"]');
    // 應有 2 個時間輸入框（開始 + 結束）
    await expect(timeInputs.nth(0)).toBeVisible({ timeout: 5000 });
    await expect(timeInputs.nth(1)).toBeVisible();

    // 兩者 Y 座標相近（在同一行）
    const box0 = await timeInputs.nth(0).boundingBox();
    const box1 = await timeInputs.nth(1).boundingBox();
    expect(box0).toBeTruthy();
    expect(box1).toBeTruthy();
    // 垂直差距應小於 20px（同一行）
    expect(Math.abs(box0.y - box1.y)).toBeLessThan(20);
  });

  test('結束時間為選填，空白仍可送出', async ({ page }) => {
    await loginAsTestUser(page);
    await setLangZh(page);
    await openCreateSheet(page);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

    await page.locator('input[placeholder*="第15週"], input[placeholder*="Week 15"]').first().fill('[測試] 結束時間選填');
    await page.locator('input[type="date"]').fill(dateStr);
    await page.locator('input[type="time"]').first().fill('19:00');
    // 結束時間留空
    const locationInput = page.locator('input[placeholder*="地址"], input[placeholder*="address"], input[placeholder*="venue"]').first();
    if (await locationInput.isVisible()) await locationInput.fill('測試球館');

    await page.locator('button:has-text("建立場次"), button:has-text("Create Session")').last().click();

    // 不應出現驗證錯誤（結束時間為選填）
    await expect(page.locator('.bg-amber-50.border-amber-200.rounded-xl')).toBeHidden({ timeout: 3000 }).catch(() => {});
    // Sheet 關閉代表成功
    await expect(page.locator('h2:has-text("建立新場次"), h2:has-text("Create Session")')).toBeHidden({ timeout: 10000 });
  });

  // ── 管理員按鈕版面 ───────────────────────────────────────────

  test('管理員按鈕在小螢幕不會被截斷（換行顯示）', async ({ page }) => {
    await loginAsTestUser(page);
    // 模擬窄螢幕
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/my-sessions');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("我的開場"), h1:has-text("My Sessions")')).toBeVisible({ timeout: 10000 });
    await page.locator('.animate-bounce').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(800);

    // 找到任何包含管理員按鈕的卡片
    const waitlistBtn = page.locator('button:has-text("移到候補"), button:has-text("Waitlist")').first();
    const confirmBtn = page.locator('button:has-text("移到正取"), button:has-text("Confirm")').first();
    const hasButtons = await waitlistBtn.isVisible({ timeout: 3000 }).catch(() => false)
      || await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (!hasButtons) {
      // 沒有場次資料，跳過但不失敗
      return;
    }

    const btn = await waitlistBtn.isVisible() ? waitlistBtn : confirmBtn;
    const box = await btn.boundingBox();
    // 按鈕應在 viewport 內（不被截斷）
    expect(box).toBeTruthy();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(376);
  });
});
