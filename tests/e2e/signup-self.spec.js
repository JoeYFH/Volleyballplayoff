import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../helpers/auth.js';
import { fillSignupForm, openSignupModal, clickStatusFilter, clickGenderFilter } from '../helpers/signup.js';
import { createTestSession, deleteTestSession } from '../helpers/session.js';

test.describe.serial('自己報名', () => {
  let maleSessionId;
  let mixedSessionId;

  test.beforeAll(async () => {
    maleSessionId = await createTestSession('male');
    mixedSessionId = await createTestSession('mixed', { maleLimit: 3, femaleLimit: 3, limitTotal: 6 });
    console.log(`\n🏐 自己報名測試場次 male=${maleSessionId} mixed=${mixedSessionId}`);
  });

  test.afterAll(async () => {
    await deleteTestSession(maleSessionId);
    await deleteTestSession(mixedSessionId);
    console.log('\n🗑️  刪除自己報名測試場次');
  });

  // ── 純男場次自己報名 ──────────────────────────────────────

  test('登入後純男場次可以自己報名', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/');
    await page.locator('button:has-text("報名中")').first().waitFor({ state: 'visible', timeout: 12000 });
    await page.locator('.animate-bounce').waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
    await page.locator('[id^="card-"]').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});

    await clickStatusFilter(page, '所有');
    await clickGenderFilter(page, '♂ 男生');

    await openSignupModal(page, maleSessionId);
    await fillSignupForm(page, {});

    await expect(page.locator('div.fixed.inset-0.z-40')).toBeHidden({ timeout: 8000 });

    // 名單至少有 1 筆報名
    const list = page.locator(`#list-${maleSessionId}`);
    await expect(list).toBeVisible({ timeout: 5000 });
    const items = list.locator('[class*="flex"][class*="items"]');
    await expect(items.first()).toBeVisible({ timeout: 5000 });
  });

  test('取消自己的報名後名單清空', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/');
    await page.locator('button:has-text("報名中")').first().waitFor({ state: 'visible', timeout: 12000 });
    await page.locator('.animate-bounce').waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
    await page.locator('[id^="card-"]').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});

    await clickStatusFilter(page, '所有');
    await clickGenderFilter(page, '♂ 男生');

    const card = page.locator(`#card-${maleSessionId}`);
    await expect(card).toBeVisible({ timeout: 10000 });

    // 點 ✕ 取消報名（confirm dialog 由 Playwright 自動接受）
    page.on('dialog', d => d.accept());
    const cancelBtn = card.locator('button[title="取消報名"], button[title="Cancel signup"]').first();
    await expect(cancelBtn).toBeVisible({ timeout: 5000 });
    await cancelBtn.click();

    // 取消後名單應為空
    const list = page.locator(`#list-${maleSessionId}`);
    await expect(list).toBeVisible({ timeout: 5000 });
    await expect(list.locator('button[title="取消報名"], button[title="Cancel signup"]')).toBeHidden({ timeout: 5000 });
  });

  test('編輯報名可儲存變更', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/');
    await page.locator('button:has-text("報名中")').first().waitFor({ state: 'visible', timeout: 12000 });
    await page.locator('.animate-bounce').waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
    await page.locator('[id^="card-"]').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});

    await clickStatusFilter(page, '所有');
    await clickGenderFilter(page, '♂ 男生');

    // 先報名
    await openSignupModal(page, maleSessionId);
    await fillSignupForm(page, {});
    await expect(page.locator('div.fixed.inset-0.z-40')).toBeHidden({ timeout: 8000 });

    // 點 ✏️ 編輯
    const card = page.locator(`#card-${maleSessionId}`);
    const editBtn = card.locator('button[title="編輯報名"], button[title="Edit signup"]').first();
    await expect(editBtn).toBeVisible({ timeout: 5000 });
    await editBtn.click();

    // 編輯 modal 出現
    const modal = page.locator('div.fixed.inset-0.z-40');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // 勾選晚到
    const lateChk = modal.locator('input[type="checkbox"]').last();
    if (await lateChk.isVisible()) await lateChk.check().catch(() => {});

    // 送出
    await modal.locator('button:has-text("更新"), button:has-text("Update"), button:has-text("報名"), button:has-text("確認")').last().click();
    await expect(modal).toBeHidden({ timeout: 8000 });
  });

  // ── 混排場次自己報名（需選性別）──────────────────────────

  test('混排場次自己報名需選性別，選女生後成功', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/');
    await page.locator('button:has-text("報名中")').first().waitFor({ state: 'visible', timeout: 12000 });
    await page.locator('.animate-bounce').waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
    await page.locator('[id^="card-"]').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});

    await clickStatusFilter(page, '所有');
    await clickGenderFilter(page, '⚥ 混排');

    await openSignupModal(page, mixedSessionId);
    await fillSignupForm(page, { gender: 'female' });

    await expect(page.locator('div.fixed.inset-0.z-40')).toBeHidden({ timeout: 8000 });

    const list = page.locator(`#list-${mixedSessionId}`);
    await expect(list).toBeVisible({ timeout: 5000 });
    await expect(list.locator('button[title="取消報名"], button[title="Cancel signup"]').first()).toBeVisible({ timeout: 5000 });
  });
});
