
# FitAI – Expo & n8n 版 MVP 規格 v0.3  
> 更新：2025-07-16  作者：Product Team  

---

## 目錄
0. 多語化（Localization）模組 🔤  
1. 使用者驗證（User Authorisation）  
2. 飲食（Nutrition）模組  
3. 訓練（Training）模組  
4. 個人檔案模組  
5. Chatbot／通知  
6. 技術棧、專案結構與 n8n 應用  
7. MVP 建置藍圖（優先順序與時程）  
8. 結論  

---

## 0. 多語化（Localization）模組 🔤
### 0.1 語系策略
| 類別 | 多語需求 | 實作方式 | n8n 應用點 |
|------|----------|----------|------------|
| UI 文字 | 六語 | `i18next` + `expo-localization` | — |
| 動作／食物名稱 | 六語 (en_US.json,es_ES.json,ja_JP.json,zh_CN.json,de_DE.json,zh_TW)| `exercise_translations`、`food_translations` | Crowdin → **n8n** 自動同步翻譯 JSON |
| AI 產生文字 | 依使用者語系 | `ai.py` 參數 `target_language` | **n8n** 定時任務：批量離線翻譯 cache |
| 推播／聊天機器人 | 依使用者語系 | FCM + OneSignal 模板 | **n8n** Webhook/IF Node 轉送多語模板 |

---

## 1. 使用者驗證（User Authorisation）
| 方法 | 路徑 | 描述 | n8n |
|------|------|------|-----|
| POST | /api/auth/signup | Email／Apple 註冊 | **n8n** 發送 Welcome Mail |
| POST | /api/auth/signin | 登入 | — |
| GET  | /api/auth/profile | 取得個資 | — |
| PUT  | /api/auth/update-profile | 更新暱稱、頭像、preferred_lang | — |
| POST | /api/auth/forgot-password _(Phase 2)_ | 忘記密碼 | **n8n** Password Reset Mail |

---

## 2. 飲食（Nutrition）模組
A. 營養儀表板 `GET /api/nutrition/summary`  
B. 目標設定 `POST /api/nutrition/goal`  
C. AI 熱量計算 `POST /api/nutrition/ai-calc`  
D. 條碼掃描 `GET /api/nutrition/upc/{barcode}`  
E. 日誌 CRUD (`/api/nutrition/log*`)  
F. 進度追蹤 `GET /api/nutrition/progression`  
• **n8n** 場景：每日 00:00 UTC 定時抓取前日飲食，彙整週報資料 → 供 Phase 2 推播

---

## 3. 訓練（Training）模組
A. 動作資料庫 CRUD  
B. 訓練模板 CRUD  
C. 週期化計畫（Meso Cycle）  
D. 訓練日誌與統計 `/api/training/*`  
• **n8n** 場景：當使用者訓練日誌達成週目標 → IF Node 觸發徽章/Email

---

## 4. 個人檔案模組
| 方法 | 路徑 | 功能 |
|------|------|------|
| GET  | /api/user/profile | 取得詳細檔案 |
| PUT  | /api/user/profile | 更新暱稱、生日、頭像、preferred_lang |
• **n8n** 場景：生日當天自動發送祝福推播

---

## 5. Chatbot／通知
• LINE／Telegram／Slack 皆透過 **n8n Webhook** 觸發  
• 每週 AI 報告：Cron Node → HTTP Node (Backend) → Telegram Node  
• 訊息範本檔 `msg_template_<lang>.md` 由 **n8n** 調用 S3/Minio 存儲  

---

## 6. 技術棧、專案結構與 n8n 應用
### 6.1 前端（跨平台 iOS / Android / Web）
| 項目 | 選型 |
|------|------|
| 框架 | **Expo (React Native + TypeScript)** |
| 狀態管理 | Zustand + React Query |
| 多語 | i18next / expo-localization |
| Charts | Victory Native |
| OTA | Expo Updates |
| 原生模組 | `expo-barcode-scanner`, `expo-auth-session` |

### 6.2 後端  
FastAPI + SQLAlchemy + SQLite → 可升級 Postgres  

### 6.3 DevOps / CI  
| 項目 | 工具 |
|------|------|
| 編譯 | **EAS Build** (Expo Application Services) |
| 測試 | Jest + React Native Testing Library |
| Lint | ESLint + Prettier |
| Backend CI | GitHub Actions → Docker Build → Fly.io |
| Mobile CI | EAS Pipeline → TestFlight / Google Play Internal |

### 6.4 n8n 角色
1. 通知：Email、推播、Chatbot  
2. I18N：Crowdin or Google Sheets sync  
3. Report：定時彙總使用者營養/訓練數據產生 PDF  
4. ETL：將 SQLite 日誌備份至 BigQuery（每日）  

### 6.5 Monorepo 目錄（Expo）
```
fitai/
├─ apps/
│  ├─ mobile/            ← Expo managed app
│  │  ├─ App.tsx
│  │  ├─ app.json
│  │  └─ src/
│  │     ├─ screens/
│  │     ├─ components/
│  │     ├─ features/{auth,nutrition,training,profile}/
│  │     └─ localization/
│  └─ web/ _(optional)_
├─ backend/
│  ├─ app.py
│  ├─ routes/
│  ├─ middlewares/i18n.py
│  └─ utils/
├─ n8n/
│  └─ workflows/*.json   ← 可匯入 n8n Cloud / Self-host
└─ .github/workflows/
   ├─ backend-ci.yml
   └─ expo-eas.yml
```

---

## 7. MVP 建置藍圖（Expo 版）

### 7.1 MVP 範圍確認
| 模組 | 主要功能 | 納入 MVP | 理由 |
|------|----------|---------|------|
| 0. I18N 架構 | i18next + Backend | ✅ | 核心賣點 |
| 1. Auth | Email/Apple 登入 | ✅ | 基礎 |
| 2. Nutrition | Dashboard + 日誌 | ✅ | 留存 |
| 3. Training | Lite 版 | ⚠️ | 展示健身 |
| 4. Profile | 語系設定 | ✅ | — |
| 5. Chatbot | 週報/推播 | ❌ Phase 2 | 增值 |
| Analytics | Amplitude/Firebase | ❌ | 後補 |

### 7.2 里程碑 & 人日估算
| Phase | 里程碑 | 內容 | 人日 | 出口條件 |
|-------|-------|------|------|----------|
| P0 | 環境／CI | Expo CLI、EAS、GitHub Actions | 1 | `expo start` + lint pass |
| P1 | I18N Foundation | i18next + Crowdin Sync (n8n) | 2 | UI 多語切換 |
| P2 | Auth + Profile | Auth Flow, 語系欄位 | 3 | 登入 + 改語系 |
| P3 | Nutrition Core | Dashboard, 日誌 CRUD, AI | 5 | 記一筆日誌 |
| P4 | Training Lite | 動作庫 + 日誌 | 3 | 記錄一次訓練 |
| P5 | Polish & QA | OTA, 多語校對, TestFlight | 2 | 20 人內測 |

**總計：16 人日 ≈ 4 週**

### 7.3 逐階段檢查清單（含 n8n）
- **Phase 0**  
  - Expo CLI 初始化、EAS Build 測試  
  - n8n Docker Stack 部署（若自架）  
- **Phase 1**  
  - 字串抽取 → Crowdin  
  - n8n Workflow：Crowdin ↔ Git Hub Sync  
- **Phase 2**  
  - Auth API、Sign-in UI  
  - n8n Welcome Mail + Password Reset 範本  
- **Phase 3**  
  - Nutrition API、Ring Chart  
  - n8n Cron：日誌彙整 → BigQuery  
- **Phase 4**  
  - 動作庫 20 個 + 多語翻譯  
  - n8n IF Node：達標推播  
- **Phase 5**  
  - OTA 更新、Crash 修正、EAS Submit  
  - n8n 報告 PDF & Chatbot 發送  

### 7.4 技術決策
1. 前端：Expo Managed Workflow (TS)  
2. 後端：FastAPI + SQLite  
3. AI：OpenAI GPT-4o；Token Cache  
4. DevOps：EAS Build / Fly.io  
5. 自動化：**n8n**（通知、翻譯、報表、ETL）

### 7.5 風險與緩解
| 風險 | 緩解 |
|------|------|
| OTA 破版 | 先在內測渠道灰度釋出 |
| 翻譯量大 | n8n + Crowdin 自動工作流 |
| AI 成本 | Caching & 日限額 |
| 單人開發 | 嚴守 MVP 範圍 |

### 7.6 Sprint 1 Backlog
1. Expo CLI + GitHub Init  
2. EAS Pipeline + Android/iOS 架設  
3. ESLint / Prettier 配置  
4. i18next scaffold（en, zh-TW）  
5. Auth API stub + Login Screen  
6. n8n Server 部署 & Welcome Mail Flow  

---

## 8. 結論
此版本將前端切換為 **Expo**，並在每個模組標註了 **n8n** 可介入的自動化場景，確保 4 週內交付跨平台、多語的 MVP。  
若您需要：

- n8n 範例 workflow（JSON）  
- EAS CI 設定檔  
- 具體 API Contract 或 DB Schema  

請隨時提出，我會再補充！  
