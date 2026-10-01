#!/usr/bin/env node
/**
 * 讀取 Playwright JSON 結果，輸出好閱讀的摘要報告
 * 使用方式：node scripts/report.js
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const RESULTS_PATH = resolve('test-results/results.json');
const OUTPUT_PATH  = resolve('test-results/report.md');

if (!existsSync(RESULTS_PATH)) {
  console.error('找不到 test-results/results.json，請先執行 npm test');
  process.exit(1);
}

const raw    = JSON.parse(readFileSync(RESULTS_PATH, 'utf8'));
const suites = raw.suites ?? [];

// ── 遞迴抓出所有測試 ──────────────────────────────────────────
function collectTests(node, out = []) {
  for (const s of node.suites  ?? []) collectTests(s, out);
  for (const t of node.specs   ?? []) {
    for (const r of t.tests ?? []) {
      out.push({ title: t.title, status: r.status, browser: r.projectName, errors: r.results?.flatMap(x => x.errors ?? []) ?? [] });
    }
  }
  return out;
}

const tests  = suites.flatMap(s => collectTests(s));
const passed = tests.filter(t => t.status === 'passed');
const failed = tests.filter(t => t.status === 'failed' || t.status === 'timedOut');
const skipped= tests.filter(t => t.status === 'skipped');

// ── 錯誤建議 ──────────────────────────────────────────────────
const HINTS = [
  { match: /ERR_NAME_NOT_RESOLVED|net::ERR_FAILED|fetch failed/i,   hint: '**網路問題**：無法連到 baseURL。確認網路正常且 `https://volleyballplayoff.web.app` 可開啟。' },
  { match: /waitForSelector.*hidden.*timeout/i,                      hint: '**登入失敗**：`#loginBtn.hidden` 等不到。確認 `.env.test` 的帳密正確，且 Supabase Auth 有啟用 Email provider。' },
  { match: /loadingSpinner.*hidden.*timeout/i,                       hint: '**資料載入超時**：Supabase realtime 或 REST 可能未回應，或 anon key 不正確。' },
  { match: /signupModal.*hidden.*timeout/i,                          hint: '**報名 Modal 未關閉**：表單送出後 Modal 沒消失，可能是 API 錯誤或 RLS policy 阻擋寫入。' },
  { match: /Timeout.*exceeded/i,                                     hint: '**逾時**：整體 30 秒逾時。網路慢或目標 selector 不存在。' },
  { match: /Cannot find module/i,                                    hint: '**缺少套件**：執行 `npm install` 補裝相依套件。' },
  { match: /storageKey|localStorage/i,                               hint: '**Auth 注入失敗**：localStorage key 格式可能不符。確認 `auth.js` 裡的 `storageKey` 與 Supabase 專案 ref 相符。' },
];

function getHint(errors) {
  const text = errors.map(e => e.message ?? '').join('\n');
  for (const { match, hint } of HINTS) {
    if (match.test(text)) return hint;
  }
  return '';
}

// ── 輸出報告 ──────────────────────────────────────────────────
const lines = [];
lines.push(`# Playwright 測試報告`);
lines.push(`\n> 產生時間：${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}`);
lines.push(`\n## 摘要`);
lines.push(`| 結果 | 數量 |`);
lines.push(`|------|------|`);
lines.push(`| ✅ 通過 | ${passed.length} |`);
lines.push(`| ❌ 失敗 | ${failed.length} |`);
lines.push(`| ⏭️ 跳過 | ${skipped.length} |`);
lines.push(`| 合計 | ${tests.length} |`);

if (failed.length) {
  lines.push(`\n## ❌ 失敗清單`);
  for (const t of failed) {
    lines.push(`\n### ${t.title}（${t.browser}）`);
    if (t.errors.length) {
      lines.push('```');
      lines.push(t.errors.map(e => e.message ?? e).join('\n---\n').slice(0, 800));
      lines.push('```');
    }
    const hint = getHint(t.errors);
    if (hint) lines.push(`\n> 💡 ${hint}`);
  }
}

if (passed.length) {
  lines.push(`\n## ✅ 通過清單`);
  for (const t of passed) lines.push(`- ${t.title}（${t.browser}）`);
}

if (skipped.length) {
  lines.push(`\n## ⏭️ 跳過清單`);
  for (const t of skipped) lines.push(`- ${t.title}（${t.browser}）`);
}

lines.push(`\n---`);
lines.push(`\n## 常見問題排除\n`);
lines.push(`**1. 環境設定**`);
lines.push(`\`\`\`bash`);
lines.push(`cat .env.test   # 確認有 SUPABASE_URL, SUPABASE_ANON_KEY, TEST_EMAIL, TEST_PASSWORD`);
lines.push(`\`\`\``);
lines.push(`**2. 測試帳號**`);
lines.push(`- Supabase Dashboard → Authentication → Users → 確認 \`test@volleyballplayoff.com\` 存在`);
lines.push(`- 狀態須為 **Confirmed**（不是 Invited）`);
lines.push(`**3. RLS policy**`);
lines.push(`- Supabase SQL Editor 執行 \`select * from signups limit 1\` 確認可讀`);
lines.push(`- 執行 insert/delete 確認有寫入權限`);
lines.push(`**4. 重新執行失敗測試**`);
lines.push(`\`\`\`bash`);
lines.push(`npx playwright test --grep "場次列表" --headed   # 有視窗模式，方便觀察`);
lines.push(`\`\`\``);

const md = lines.join('\n');
writeFileSync(OUTPUT_PATH, md, 'utf8');
console.log(`\n✅ 報告已輸出到 test-results/report.md`);
console.log(`   通過 ${passed.length}　失敗 ${failed.length}　跳過 ${skipped.length}　合計 ${tests.length}\n`);
if (failed.length) process.exit(1);
