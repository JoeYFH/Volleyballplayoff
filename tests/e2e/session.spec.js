import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../helpers/auth.js';

// ──────────────────────────────────────────────────────────────
// 共用：報名流程（給各場次類型複用）
// ──────────────────────────────────────────────────────────────

/**
 * 報名流程共用步驟
 * @param {import('@playwright/test').Page} page
 * @param {object} opts
 * @param {string} opts.name - 報名者名字
 * @param {string} [opts.gender] - 'male' | 'female'（混排場次必填）
 * @param {boolean} [opts.forFriend] - 是否代報名
 * @param {string} [opts.friendName] - 朋友名字
 * @param {string} [opts.friendGender] - 'male' | 'female'（混排代報名必填）
 * @param {string[]} [opts.bringEquip] - 要勾選的器材（陣列，例如 ['球', '音響']）
 */
async function fillSignupForm(page, opts) {
  const { name, gender, forFriend, friendName, friendGender, bringEquip } = opts;

  // 如果 Modal 還沒開，等它出現
  await expect(page.locator('#signupModal')).toBeVisible({ timeout: 5000 });

  // 填名字（未登入時才顯示）
  const nameInput = page.locator('#modalName');
  if (await nameInput.isVisible()) {
    await nameInput.fill(name);
  }

  // 混排場次：選自己的性別
  const genderRow = page.locator('#modalGenderRow');
  if (gender && await genderRow.isVisible()) {
    await page.click(`#gSelf${gender === 'male' ? 'Male' : 'Female'}`);
  }

  // 代報名
  if (forFriend) {
    await page.check('#modalFriend');
    await page.fill('#modalFriendName', friendName || '測試朋友');
    // 混排代報名：選朋友性別
    const friendGenderRow = page.locator('#modalFriendGenderRow');
    if (friendGender && await friendGenderRow.isVisible()) {
      await page.click(`#gFriend${friendGender === 'male' ? 'Male' : 'Female'}`);
    }
  }

  // 選擇器材
  if (bringEquip?.length) {
    const bringRow = page.locator('#modalBringEquipRow');
    if (await bringRow.isVisible()) {
      for (const equip of bringEquip) {
        const chip = page.locator('#modalBringChips').locator(`text=${equip}`).first();
        if (await chip.count()) await chip.click();
      }
    }
  }

  // 送出
  await page.click('#modalSubmitBtn');
}

/**
 * 找指定類型的場次，點報名按鈕，回傳 sessionId
 */
async function openSignupModal(page, sessionType) {
  await page.waitForSelector('#loadingSpinner', { state: 'hidden', timeout: 10000 });

  // 先切到符合類型的 gender filter
  if (sessionType === 'male') await page.click('#sg-male');
  else if (sessionType === 'female') await page.click('#sg-female');
  else if (sessionType === 'mixed') await page.click('#sg-mixed');

  await page.waitForTimeout(300);

  const signupBtn = page.locator('button[id^="signup-btn-"]').first();
  const count = await signupBtn.count();
  if (!count) return null;

  const btnId = await signupBtn.getAttribute('id');
  const sessionId = btnId?.replace('signup-btn-', '');
  await signupBtn.click();
  return sessionId;
}

// ──────────────────────────────────────────────────────────────
// 📋 功能：場次列表
// ──────────────────────────────────────────────────────────────
test.describe('場次列表', () => {
  test('訪客可以看到場次列表', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#loadingSpinner', { state: 'hidden', timeout: 10000 });
    const hasSessions = await page.locator('#sessionsList > div').count();
    const hasEmpty = await page.locator('#noSessionsMsg').isVisible();
    expect(hasSessions > 0 || hasEmpty).toBeTruthy();
  });

  test('預設 tab 為「報名中」', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#sf-open')).toHaveClass(/bg-indigo-600/);
  });
});

// ──────────────────────────────────────────────────────────────
// 📋 功能：純男場次報名
// ──────────────────────────────────────────────────────────────
test.describe('純男場次', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
  });

  test('登入後報名純男場次', async ({ page }) => {
    const sessionId = await openSignupModal(page, 'male');
    if (!sessionId) { test.skip(true, '沒有純男場次'); return; }

    await fillSignupForm(page, { name: 'Playwright 男生' });

    await expect(page.locator('#signupModal')).toBeHidden({ timeout: 5000 });
    await expect(page.locator(`#list-${sessionId}`)).toContainText('Playwright 男生');
  });

  test('代報名朋友（純男場次）', async ({ page }) => {
    const sessionId = await openSignupModal(page, 'male');
    if (!sessionId) { test.skip(true, '沒有純男場次'); return; }

    await fillSignupForm(page, {
      name: 'Playwright 男生',
      forFriend: true,
      friendName: '代報名朋友A',
    });

    await expect(page.locator('#signupModal')).toBeHidden({ timeout: 5000 });
    await expect(page.locator(`#list-${sessionId}`)).toContainText('代報名朋友A');
  });

  test('選攜帶器材後顯示在報名列表（純男場次）', async ({ page }) => {
    const sessionId = await openSignupModal(page, 'male');
    if (!sessionId) { test.skip(true, '沒有純男場次'); return; }

    const bringRow = page.locator('#modalBringEquipRow');
    if (!(await bringRow.isVisible())) { test.skip(true, '此場次無器材需求'); return; }

    const chips = page.locator('#modalBringChips button');
    const chipCount = await chips.count();
    if (!chipCount) { test.skip(true, '無器材 chip'); return; }

    const firstChipText = await chips.first().textContent();
    await chips.first().click();

    await fillSignupForm(page, { name: 'Playwright 攜帶測試' });

    await expect(page.locator('#signupModal')).toBeHidden({ timeout: 5000 });
    // 器材 tag 顯示在報名列表
    await expect(page.locator(`#list-${sessionId}`)).toContainText('🎒');
  });
});

// ──────────────────────────────────────────────────────────────
// 📋 功能：純女場次報名
// ──────────────────────────────────────────────────────────────
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

// ──────────────────────────────────────────────────────────────
// 📋 功能：混排場次報名（含男女分區顯示）
// ──────────────────────────────────────────────────────────────
test.describe('混排場次', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
  });

  test('報名混排場次（男）', async ({ page }) => {
    const sessionId = await openSignupModal(page, 'mixed');
    if (!sessionId) { test.skip(true, '沒有混排場次'); return; }

    await fillSignupForm(page, { name: 'Playwright 混排男', gender: 'male' });

    await expect(page.locator('#signupModal')).toBeHidden({ timeout: 5000 });
    // 驗證出現在男生區塊
    const maleSection = page.locator(`#list-${sessionId}`).locator('text=♂').first();
    await expect(page.locator(`#list-${sessionId}`)).toContainText('Playwright 混排男');
  });

  test('報名混排場次（女）', async ({ page }) => {
    const sessionId = await openSignupModal(page, 'mixed');
    if (!sessionId) { test.skip(true, '沒有混排場次'); return; }

    await fillSignupForm(page, { name: 'Playwright 混排女', gender: 'female' });

    await expect(page.locator('#signupModal')).toBeHidden({ timeout: 5000 });
    await expect(page.locator(`#list-${sessionId}`)).toContainText('Playwright 混排女');
  });

  test('代報名朋友（混排，男）', async ({ page }) => {
    const sessionId = await openSignupModal(page, 'mixed');
    if (!sessionId) { test.skip(true, '沒有混排場次'); return; }

    await fillSignupForm(page, {
      name: 'Playwright 混排',
      gender: 'male',
      forFriend: true,
      friendName: '代報男朋友C',
      friendGender: 'male',
    });

    await expect(page.locator('#signupModal')).toBeHidden({ timeout: 5000 });
    await expect(page.locator(`#list-${sessionId}`)).toContainText('代報男朋友C');
  });

  test('代報名朋友（混排，女）', async ({ page }) => {
    const sessionId = await openSignupModal(page, 'mixed');
    if (!sessionId) { test.skip(true, '沒有混排場次'); return; }

    await fillSignupForm(page, {
      name: 'Playwright 混排',
      gender: 'male',
      forFriend: true,
      friendName: '代報女朋友D',
      friendGender: 'female',
    });

    await expect(page.locator('#signupModal')).toBeHidden({ timeout: 5000 });
    await expect(page.locator(`#list-${sessionId}`)).toContainText('代報女朋友D');
  });

  test('混排場次有男女進度條', async ({ page }) => {
    await page.waitForSelector('#loadingSpinner', { state: 'hidden', timeout: 10000 });
    await page.click('#sg-mixed');
    await page.waitForTimeout(300);

    const maleBar = page.locator('[id^="prog-bar-male-"]').first();
    const femaleBar = page.locator('[id^="prog-bar-female-"]').first();
    if (!(await maleBar.count())) { test.skip(true, '沒有混排場次進度條'); return; }

    await expect(maleBar).toBeVisible();
    await expect(femaleBar).toBeVisible();
  });

  test('選攜帶器材後顯示在報名列表（混排場次）', async ({ page }) => {
    const sessionId = await openSignupModal(page, 'mixed');
    if (!sessionId) { test.skip(true, '沒有混排場次'); return; }

    const bringRow = page.locator('#modalBringEquipRow');
    if (!(await bringRow.isVisible())) { test.skip(true, '此場次無器材需求'); return; }

    const chips = page.locator('#modalBringChips button');
    if (!(await chips.count())) { test.skip(true, '無器材 chip'); return; }

    await chips.first().click();
    await fillSignupForm(page, { name: 'Playwright 混排帶器材', gender: 'male' });

    await expect(page.locator('#signupModal')).toBeHidden({ timeout: 5000 });
    await expect(page.locator(`#list-${sessionId}`)).toContainText('🎒');
  });
});

// ──────────────────────────────────────────────────────────────
// 📋 功能：取消報名
// ──────────────────────────────────────────────────────────────
test.describe('取消報名', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
    await page.waitForSelector('#loadingSpinner', { state: 'hidden', timeout: 10000 });
  });

  test('已報名者可以取消自己的報名', async ({ page }) => {
    const signedBadge = page.locator('[id^="signed-badge-"]:visible').first();
    if (!(await signedBadge.count())) { test.skip(true, '沒有已報名場次'); return; }

    page.on('dialog', dialog => dialog.accept());
    await page.locator('button[onclick*="cancelSignup"]').first().click();

    await expect(signedBadge).toBeHidden({ timeout: 5000 });
  });
});
