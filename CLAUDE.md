# Volleyballplayoff 專案筆記

## 專案概覽
排球零打報名系統 (Volleyball Pickup Sign-up)
- URL: https://volleyballplayoff.web.app
- 技術：Firebase (Firestore, Hosting, Functions)

## OG Image (og-image.svg)
- 尺寸：1200 × 630px（標準 Open Graph 規格）
- 設計風格：參考 Mikasa V200W 排球照片（深藍背景 + 黃/藍排球 + 體育館燈光）
- 配色：
  - 背景：深藍漸層 `#0c1a3a` → `#1a3560`
  - 排球主色（黃）：`#f5c71a`
  - 排球面板（藍）：`#1535a0`
  - 強調色（黃）：`#f5c71a`
- 排版：
  - 左側：Mikasa 風格排球 SVG 插圖（圓心 330,280 半徑 205）
  - 右側文字（中心 x=890）：
    - 中文標題：排球零打報名系統（27px）
    - 英文主標：VOLLEYBALL（80px）
    - 副標：PICKUP SIGN-UP（31px，letter-spacing 7）
    - 域名：volleyballplayoff.web.app（20px）
  - 底部：體育館桁架結構 + 12 個燈光（y=533 以下）

## OG Image 快取注意事項
> **重要**：社群平台（Facebook、LINE、Discord 等）**首次爬取後會快取 OG 預覽圖**。
> 即使之後更改 og-image.svg，使用者舊的分享連結看到的仍是**快取版本**。
>
> 若要強制刷新：
> - **Facebook**：使用 [Sharing Debugger](https://developers.facebook.com/tools/debug/) 輸入網址重新抓取
> - **LINE**：無法手動刷新，等 LINE 伺服器自動更新（通常 1–7 天）
> - **Discord**：訊息中點選右上角刷新圖示，或等快取過期（24 小時）
> - **Twitter/X**：使用 [Card Validator](https://cards-dev.twitter.com/validator)

## 檔案結構
```
index.html         # 主報名頁面
admin.html         # 管理後台
share.html         # 分享頁面
my-sessions.html   # 我的場次
my-signups.html    # 我的報名
og-image.svg       # 社群分享預覽圖（OG Image）
firebase.json      # Firebase 部署設定
firestore.rules    # Firestore 安全規則
firebase-config.js # Firebase 設定
i18n.js            # 多語系
functions/         # Cloud Functions
```

## Git 規範

### 分支
- 主線：`main` / `master`
- 開發分支命名：`claude/<功能名稱>-<session-id>`

### Commit 訊息格式
**中英文對照**，標題用英文，body 可補充中文說明：

```
<英文動詞> <簡短描述>

- 中文說明變更內容或原因
- 可列多條

https://claude.ai/code/session_xxx
```

範例：
```
redesign og-image.svg with Mikasa volleyball style

- 重新設計社群分享預覽圖，改用 SVG 排球插圖
- 加入體育館桁架結構與燈光效果
- 保留中英文標題文字
```

- 標題動詞：`add` 新增 / `update` 更新 / `fix` 修正 / `remove` 移除 / `redesign` 重新設計
- 標題不超過 70 字元
- 每次 commit 附上 session URL

## 使用者偏好
- 對話語言：繁體中文
- 回覆風格：簡潔直接
- 上傳圖片用途：作為設計風格參考（不直接嵌入，轉為 SVG）
