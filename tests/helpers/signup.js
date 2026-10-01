import { expect } from '@playwright/test';

/** 等待報名 modal 出現 */
async function waitForModal(page) {
  // Modal is teleported to body: fixed overlay with bottom sheet
  await expect(page.locator('div.fixed.inset-0.z-40')).toBeVisible({ timeout: 8000 });
}

/**
 * 在首頁點擊指定場次的「我要報名」按鈕，開啟 modal
 * @returns {Promise<void>}
 */
export async function openSignupModal(page, sessionId) {
  const card = page.locator(`#card-${sessionId}`);
  await expect(card).toBeVisible({ timeout: 10000 });
  await card.locator('button:has-text("我要報名"), button:has-text("Sign Up")').click();
  await waitForModal(page);
}

/**
 * 填寫並送出報名表單（適用新 Vue app）
 *
 * @param {object} opts
 *   name       - 姓名（只在未登入時需填；登入後用 Google profile）
 *   gender     - 'male' | 'female'（混排場次必填）
 *   forFriend  - boolean
 *   friendName - 朋友姓名（forFriend=true 時必填）
 *   friendGender - 'male' | 'female'（混排 + forFriend）
 */
export async function fillSignupForm(page, opts = {}) {
  const modal = page.locator('div.fixed.inset-0.z-40');
  await expect(modal).toBeVisible({ timeout: 8000 });

  // 姓名（只有未登入才顯示 input）
  const nameInput = modal.locator('input[type="text"]').first();
  if (opts.name && await nameInput.isVisible()) {
    await nameInput.fill(opts.name);
  }

  // 自己的性別（混排，未選代報名時）
  if (opts.gender && !opts.forFriend) {
    const genderBtn = opts.gender === 'male'
      ? modal.locator('button:has-text("♂")').first()
      : modal.locator('button:has-text("♀")').first();
    if (await genderBtn.isVisible()) await genderBtn.click();
  }

  // 代報名
  if (opts.forFriend) {
    const chk = page.locator('#modalFriendChk');
    if (!(await chk.isChecked())) await chk.check();

    if (opts.friendName) {
      // 朋友姓名 input 在 checkbox 區塊後
      const friendInput = modal.locator('#modalFriendChk ~ div input[type="text"], #modalFriendChk + label + div input[type="text"]');
      // fallback: second text input in modal
      const inputs = modal.locator('input[type="text"]');
      const cnt = await inputs.count();
      if (cnt >= 2) await inputs.last().fill(opts.friendName);
      else if (await friendInput.count()) await friendInput.first().fill(opts.friendName);
    }

    if (opts.friendGender) {
      // 朋友性別按鈕（在 for-friend 區塊內，應為 modal 內的最後一組 ♂/♀）
      const btn = opts.friendGender === 'male'
        ? modal.locator('button:has-text("♂")').last()
        : modal.locator('button:has-text("♀")').last();
      if (await btn.isVisible()) await btn.click();
    }
  }

  // 送出
  await modal.locator('button:has-text("報名"), button:has-text("送出"), button:has-text("Submit")').last().click();
}

/**
 * 關閉 modal（點背景）
 */
export async function closeModal(page) {
  await page.locator('div.fixed.inset-0.z-40 .absolute.inset-0.bg-black\\/40').click({ force: true });
  await expect(page.locator('div.fixed.inset-0.z-40')).toBeHidden({ timeout: 5000 });
}

/**
 * 點首頁 FilterBar 的狀態 tab
 */
export async function clickStatusFilter(page, label) {
  await page.locator(`button:has-text("${label}")`).first().click();
  await page.waitForTimeout(400);
}

/**
 * 點首頁 FilterBar 的性別 tab
 */
export async function clickGenderFilter(page, label) {
  await page.locator(`button:has-text("${label}")`).first().click();
  await page.waitForTimeout(400);
}
