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
const stats  = raw.stats  ?? {};

// ── 遞迴抓出所有測試 ──────────────────────────────────────────
function collectTests(node, suiteName = '', out = []) {
  const name = node.title || suiteName;
  for (const s of node.suites ?? []) collectTests(s, name, out);
  for (const t of node.specs  ?? []) {
    for (const r of t.tests ?? []) {
      out.push({
        suite:  name,
        title:  t.title,
        status: r.status,
        browser: r.projectName,
        duration: r.results?.[r.results.length - 1]?.duration ?? 0,
        errors: r.results?.flatMap(x => x.errors ?? []) ?? [],
      });
    }
  }
  return out;
}

const tests   = suites.flatMap(s => collectTests(s));
const passed  = tests.filter(t => t.status === 'passed');
const failed  = tests.filter(t => t.status === 'failed' || t.status === 'timedOut');
const skipped = tests.filter(t => t.status === 'skipped');

// ── 場次建立流程說明 ──────────────────────────────────────────
function getSessionSetupNote(suiteName) {
  if (/純男/.test(suiteName)) return 'male（純男）';
  if (/純女/.test(suiteName)) return 'female（純女）';
  if (/混排/.test(suiteName)) return 'mixed（混排）';
  return null;
}

// 收集本次有哪些場次類型
const sessionTypes = [...new Set(
  tests.map(t => getSessionSetupNote(t.suite)).filter(Boolean)
)];

// ── 錯誤建議 ──────────────────────────────────────────────────
const HINTS = [
  { match: /ERR_NAME_NOT_RESOLVED|net::ERR_FAILED|fetch failed/i,
    hint: '**網路問題**：無法連到 `https://volleyballplayoff.web.app`，確認網路正常。' },
  { match: /Invalid API key/i,
    hint: '**API Key 錯誤**：`.env.test` 的 `SUPABASE_ANON_KEY` 不正確，從 Supabase Dashboard → Settings → API 重新複製。' },
  { match: /登入失敗|signInWithPassword/i,
    hint: '**測試帳號登入失敗**：確認 `.env.test` 的 `TEST_EMAIL` / `TEST_PASSWORD` 正確，且帳號在 Supabase Auth 狀態為 Confirmed。' },
  { match: /建立測試場次失敗/i,
    hint: '**場次建立失敗**：`beforeAll` 無法用 Supabase API 建立場次。確認 RLS policy 允許登入者 INSERT sessions，或 anon key 不正確。' },
  { match: /loadingSpinner.*hidden|state.*hidden.*timeout/i,
    hint: '**資料載入超時**：頁面資料沒有載入完成，可能是 Supabase realtime 或 REST 無回應。' },
  { match: /signupModal.*hidden.*timeout/i,
    hint: '**Modal 未關閉**：報名送出後 Modal 沒關閉，可能是 RLS 阻擋 INSERT signups。' },
  { match: /Timeout.*exceeded/i,
    hint: '**逾時**：30 秒內沒完成。網路慢或 selector 不存在。' },
  { match: /Cannot find module/i,
    hint: '**缺少套件**：執行 `npm install` 安裝相依套件。' },
];

function getHint(errors) {
  const text = errors.map(e => e.message ?? '').join('\n');
  for (const { match, hint } of HINTS) {
    if (match.test(text)) return hint;
  }
  return '';
}

// ── 格式化時間 ──────────────────────────────────────────────
function fmtMs(ms) {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

// ── 輸出報告 ──────────────────────────────────────────────────
const lines = [];
const runTime = fmtMs(stats.duration ?? 0);
const startTime = stats.startTime
  ? new Date(stats.startTime).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })
  : '—';

lines.push(`# Playwright 測試報告`);
lines.push(`\n> 執行時間：${startTime}　耗時：${runTime}`);

// ── 場次自動建立說明 ──────────────────────────────────────────
if (sessionTypes.length) {
  lines.push(`\n## 🏐 測試場次自動建立`);
  lines.push(`本次測試自動建立了以下測試場次（\`beforeAll\`），測試結束後自動刪除（\`afterAll\`）：`);
  lines.push('');
  for (const t of sessionTypes) {
    const suiteTests = tests.filter(x => getSessionSetupNote(x.suite) === t);
    const ok  = suiteTests.filter(x => x.status === 'passed').length;
    const err = suiteTests.filter(x => x.status === 'failed' || x.status === 'timedOut').length;
    const skip= suiteTests.filter(x => x.status === 'skipped').length;
    const icon = err > 0 ? '❌' : '✅';
    lines.push(`| ${icon} | \`type: ${t}\` | ✅ ${ok} 通過　❌ ${err} 失敗　⏭️ ${skip} 跳過 |`);
  }
  if (sessionTypes.length) lines.splice(lines.indexOf('') + 1, 0, '| 狀態 | 場次類型 | 測試結果 |', '|------|---------|---------|');
  lines.push('');
  lines.push(`> 場次以明天日期建立，標題前綴 \`[測試場次]\`，測試結束後自動從 Supabase 刪除。`);
}

lines.push(`\n## 📊 摘要`);
lines.push(`| 結果 | 數量 |`);
lines.push(`|------|------|`);
lines.push(`| ✅ 通過 | ${passed.length} |`);
lines.push(`| ❌ 失敗 | ${failed.length} |`);
lines.push(`| ⏭️ 跳過 | ${skipped.length} |`);
lines.push(`| 合計 | ${tests.length} |`);

if (failed.length) {
  lines.push(`\n## ❌ 失敗清單`);
  for (const t of failed) {
    lines.push(`\n### ${t.suite} › ${t.title}（${t.browser}）`);
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
  for (const t of passed) lines.push(`- ${t.suite} › ${t.title}（${t.browser}）　${fmtMs(t.duration)}`);
}

if (skipped.length) {
  lines.push(`\n## ⏭️ 跳過清單`);
  for (const t of skipped) lines.push(`- ${t.suite} › ${t.title}（${t.browser}）`);
}

lines.push(`\n---`);
lines.push(`\n## 🔧 常見問題排除\n`);
lines.push(`**1. 環境設定**`);
lines.push(`\`\`\`bash`);
lines.push(`cat .env.test   # 確認有 SUPABASE_URL, SUPABASE_ANON_KEY, TEST_EMAIL, TEST_PASSWORD`);
lines.push(`\`\`\``);
lines.push(`**2. 測試帳號**`);
lines.push(`- Supabase Dashboard → Authentication → Users → 確認 \`test@volleyballplayoff.com\` 存在且狀態為 **Confirmed**`);
lines.push(`**3. 場次建立失敗（beforeAll error）**`);
lines.push(`- Supabase Dashboard → Table Editor → sessions → 確認登入者可新增資料`);
lines.push(`- 或在 SQL Editor 執行：\`SELECT * FROM sessions WHERE title LIKE '[測試場次]%'\` 查看殘留資料`);
lines.push(`**4. 重新執行單一類型**`);
lines.push(`\`\`\`bash`);
lines.push(`npm run test:male    # 只跑純男`);
lines.push(`npm run test:female  # 只跑純女`);
lines.push(`npm run test:mixed   # 只跑混排`);
lines.push(`npx playwright test tests/e2e/male.spec.js --headed  # 開視窗觀察`);
lines.push(`\`\`\``);

const md = lines.join('\n');
writeFileSync(OUTPUT_PATH, md, 'utf8');
console.log(`\n✅ 報告已輸出到 test-results/report.md`);
console.log(`   通過 ${passed.length}　失敗 ${failed.length}　跳過 ${skipped.length}　合計 ${tests.length}　耗時 ${runTime}\n`);
if (failed.length) process.exit(1);
