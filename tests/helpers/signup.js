import { expect } from '@playwright/test';

export async function fillSignupForm(page, opts) {
  const { name, gender, forFriend, friendName, friendGender, bringEquip } = opts;

  await expect(page.locator('#signupModal')).toBeVisible({ timeout: 5000 });

  const nameInput = page.locator('#modalName');
  if (await nameInput.isVisible()) {
    await nameInput.fill(name);
  }

  const genderRow = page.locator('#modalGenderRow');
  if (gender && await genderRow.isVisible()) {
    await page.click(`#gSelf${gender === 'male' ? 'Male' : 'Female'}`);
  }

  if (forFriend) {
    await page.check('#modalFriend');
    await page.fill('#modalFriendName', friendName || '測試朋友');
    const friendGenderRow = page.locator('#modalFriendGenderRow');
    if (friendGender && await friendGenderRow.isVisible()) {
      await page.click(`#gFriend${friendGender === 'male' ? 'Male' : 'Female'}`);
    }
  }

  if (bringEquip?.length) {
    const bringRow = page.locator('#modalBringEquipRow');
    if (await bringRow.isVisible()) {
      for (const equip of bringEquip) {
        const chip = page.locator('#modalBringChips').locator(`text=${equip}`).first();
        if (await chip.count()) await chip.click();
      }
    }
  }

  await page.click('#modalSubmitBtn');
}

export async function openSignupModal(page, sessionType) {
  await page.waitForSelector('#loadingSpinner', { state: 'hidden', timeout: 10000 });

  if (sessionType === 'male') await page.click('#sg-male');
  else if (sessionType === 'female') await page.click('#sg-female');
  else if (sessionType === 'mixed') await page.click('#sg-mixed');

  await page.waitForTimeout(300);

  const signupBtn = page.locator('button[id^="signup-btn-"]').first();
  if (!(await signupBtn.count())) return null;

  const btnId = await signupBtn.getAttribute('id');
  const sessionId = btnId?.replace('signup-btn-', '');
  await signupBtn.click();
  return sessionId;
}
