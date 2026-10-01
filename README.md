# 🏐 排球臨打報名系統

> **Volleyball Pickup Sign-up System**
> 讓球友快速建立場次、線上報名的輕量 Web App。

**Live：** https://volleyballplayoff.web.app

---

## 技術棧

| 類別 | 技術 |
|------|------|
| 前端 | Vanilla HTML / ES Modules / Tailwind CSS |
| 資料庫 | Supabase (PostgreSQL) |
| 認證 | Supabase Auth（Google OAuth） |
| Hosting | Firebase Hosting（靜態） |
| 測試 | Playwright（E2E） |

---

## 資料夾結構

```
volleyballplayoff/
│
├── index.html          # 主報名頁面（場次列表 + 報名 Modal）
├── my-sessions.html    # 我的開場（建立 / 編輯 / 管理自己的場次）
├── my-signups.html     # 我的報名（查看自己的報名紀錄）
├── admin.html          # 管理後台（Super Admin 才能看）
├── share.html          # 場次分享頁（OG 預覽）
│
├── supabase-config.js  # Supabase URL / Anon Key / Admin Emails
├── firebase-config.js  # (已棄用，保留備份)
├── i18n.js             # 多語系（繁中 / English）
├── session-form.js     # 建立場次的表單欄位（共用）
│
├── og-image.svg        # 社群分享預覽圖（1200×630）
├── firebase.json       # Firebase Hosting 設定
├── firestore.rules     # (已棄用)
├── schema.sql          # Supabase 資料庫 Schema（在 SQL Editor 執行）
│
├── functions/          # Firebase Cloud Functions（如有）
│   └── index.js
│
└── tests/
    └── e2e/            # Playwright E2E 測試
```

### 未來 Vue 重構後的目標結構

```
src/
├── stores/
│   ├── auth.js         # currentUser、signIn、signOut
│   ├── sessions.js     # 場次 CRUD、即時訂閱
│   ├── signups.js      # 報名 CRUD
│   └── templates.js    # 範本 CRUD
│
├── components/
│   ├── SessionCard.vue     # 場次卡片
│   ├── SignupModal.vue      # 報名表單 Modal
│   ├── CreateSessionSheet.vue  # 建立場次抽屜
│   ├── FilterTabs.vue      # 篩選標籤列
│   └── ProgressBar.vue     # 報名進度條
│
├── pages/
│   ├── Index.vue       # 主報名頁
│   ├── MySessions.vue  # 我的開場
│   ├── MySignups.vue   # 我的報名
│   ├── Admin.vue       # 管理後台
│   └── Share.vue       # 分享頁
│
├── router/index.js     # Vue Router 路由設定
├── App.vue
└── main.js
```

---

## 資料庫架構（Supabase）

### `sessions`（場次）

| 欄位 | 型別 | 說明 |
|------|------|------|
| `id` | uuid | 主鍵（自動產生） |
| `title` | text | 場次名稱 |
| `date` | text | 活動日期（YYYY-MM-DD） |
| `time` | text | 活動時間（HH:MM） |
| `location` | text | 地點（Google Maps 關鍵字） |
| `venue` | text | 場地名稱（選填） |
| `type` | text | 類型：`''` / `mixed` / `male` / `female` |
| `limit_total` | integer | 總人數上限（0 = 不限） |
| `male_limit` | integer | 男生名額（混排用） |
| `female_limit` | integer | 女生名額（混排用） |
| `equipment` | text[] | 需要攜帶的器材清單 |
| `note` | text | 私人備註（只有開場者看） |
| `is_open` | boolean | 是否開放報名 |
| `is_private` | boolean | 是否為私人場次 |
| `cancelled` | boolean | 是否已取消 |
| `open_at` | timestamptz | 開始開放報名時間 |
| `close_at` | timestamptz | 截止報名時間 |
| `created_by` | uuid | 建立者 UID（→ auth.users） |
| `creator_name` | text | 建立者顯示名稱 |
| `creator_photo` | text | 建立者頭貼 URL |
| `created_at` | timestamptz | 建立時間 |

### `signups`（報名）

| 欄位 | 型別 | 說明 |
|------|------|------|
| `id` | uuid | 主鍵 |
| `session_id` | uuid | 所屬場次（→ sessions.id） |
| `uid` | uuid | 報名者 UID（→ auth.users，訪客為 null） |
| `name` | text | 報名者名字 |
| `is_late` | boolean | 是否會晚到 |
| `late_minutes` | integer | 晚到幾分鐘 |
| `is_friend` | boolean | 是否代報名 |
| `friend_name` | text | 代報名的朋友名字 |
| `pair` | text | 希望搭檔的人 |
| `bring_equip` | text[] | 願意攜帶的器材 |
| `gender` | text | 本人性別：`male` / `female` / `''` |
| `friend_gender` | text | 代報名朋友的性別 |
| `force_confirmed` | boolean | 管理員強制正取 |
| `force_waitlisted` | boolean | 管理員強制候補 |
| `signed_at` | timestamptz | 報名時間（決定名次順序） |

### `templates`（範本）

| 欄位 | 型別 | 說明 |
|------|------|------|
| `id` | uuid | 主鍵 |
| `user_id` | uuid | 擁有者（→ auth.users） |
| `name` | text | 範本名稱 |
| `data` | jsonb | 範本內容（地點、時間、人數等） |
| `created_at` | timestamptz | 建立時間 |

### `feedback`（意見回饋）

| 欄位 | 型別 | 說明 |
|------|------|------|
| `id` | uuid | 主鍵 |
| `email` | text | 回饋者 Email（選填） |
| `type` | text | 類型：bug / feature / question / other |
| `urgency` | text | 緊急程度：low / medium / high |
| `description` | text | 描述內容 |
| `created_at` | timestamptz | 送出時間 |

### RLS 權限規則

| 資料表 | 讀 | 寫 | 改 | 刪 |
|--------|----|----|----|----|
| sessions | 所有人 | 登入者 | 建立者 | 建立者 |
| signups | 所有人 | 所有人 | 報名者 / 場主 | 報名者 / 場主 |
| templates | 本人 | 本人 | 本人 | 本人 |
| feedback | ✗ | 所有人 | ✗ | ✗ |

---

## 自動化測試架構

```
測試金字塔

        /\
       /E2E\          Playwright — 完整使用者流程（慢，少量）
      /------\
     / 元件測試 \     Vue Test Utils — UI 行為（中量）
    /------------\
   /   單元測試   \   Vitest — 純邏輯（快，大量）
  /--------------\
```

### 執行指令

```bash
npm run test:unit      # Vitest 單元測試
npm run test:e2e       # Playwright E2E
npm run test:e2e:ui    # Playwright 視覺介面
npm run test           # 全部
```

### 測試原則

- **單元測試**：過濾邏輯、表單驗證、資料轉換
- **元件測試**：按鈕條件顯示、事件觸發、Props 渲染
- **E2E 測試**：報名流程、建立場次流程、登入登出
- **不測**：第三方套件、CSS 樣式、靜態 HTML

---

## Super Admin

可在 `supabase-config.js` 的 `ADMIN_EMAILS` 陣列新增 Email。

Admin 權限：
- 可查看所有場次（包含私人）
- 可編輯任何人的場次
- 可管理所有報名（強制正取 / 候補）
- 可查看意見回饋

---

## 開發備註

- 對話語言：繁體中文
- 分支命名：`claude/<功能名稱>-<session-id>`
- Commit 格式：英文標題 + 中文說明 body
- Timestamps 格式：ISO 8601（`2026-06-15T09:00:00.000Z`）
