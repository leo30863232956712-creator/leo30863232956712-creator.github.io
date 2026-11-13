# Leo Chen | Personal Website with AI Assistant 🤖

這是一個為 Leo Chen 打造的現代化個人品牌網站，內嵌支援 **OpenRouter Claude Haiku 5.5** 與 **Google Apps Script (GAS)** 的智慧 AI 小客服。

🌐 **網站上線網址**: [https://leo30863232956712-creator.github.io/](https://leo30863232956712-creator.github.io/)

---

## 🌟 特色亮點

- **現代化極簡設計**: 採用深色琉璃感（Glassmorphism）與 Tailwind CSS，支援全平台響應式佈局。
- **豐富個人履歷展示**:
  - 核心簡介與數據指標
  - 專業技術生態（AI & LLM、前端、後端、DevOps）
  - 精選專案案例（包含思維推理 AI 客服、自動化數據分析看板、Multi-Agent 開發系統）
  - 工作經歷時間軸與聯絡渠道
- **右下角懸浮 AI 小客服**:
  - 機器人樣式懸浮開關，支援一鍵展開與收合。
  - **自訂 GAS 網址設定鈕 ⚙️**: 可在前端直接貼入 Google Apps Script Web App 網址並保存於本機 `localStorage`。
  - **思維推理（Reasoning Details）解析**: 完整支援 Claude Haiku 5.5 的思考歷程摺疊展示與多輪對話歷史保持。
  - **無伺服器安全後端**: 透過 Google Apps Script 作為安全中繼層，避免 API Key 暴露於前端。

---

## 🚀 後端 Google Apps Script (GAS) 部署指南

1. 開啟 [Google Apps Script 平台](https://script.google.com/)，點擊「新增專案」。
2. 將本專案中的 `gas_code.gs` 程式碼複製並貼上到編輯器中。
3. 執行一次 `setupApiKey()` 函式（或至「專案設定」->「指令碼屬性」新增 `OPENROUTER_API_KEY`）。
4. 點擊右上角「**部署 (Deploy)**」->「**新增部署作業 (New deployment)**」：
   - 類型選擇：**網頁應用程式 (Web App)**
   - 執行身分：**我 (Me)**
   - 誰可以存取：**所有人 (Anyone)** ⚠️ 務必選擇 Anyone
5. 部署後複製產生的網頁應用程式網址（以 `/exec` 結尾）。
6. 打開個人網站，點擊右下角小客服右上角的 **⚙️ 設定鈕**，貼上網址並儲存即可開始對話！
