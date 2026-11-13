/**
 * =========================================================================
 * Leo Chen 個人網站 AI 智慧小客服 - Google Apps Script (GAS) 後端程式碼
 * =========================================================================
 * 
 * 【功能說明】
 * 1. 接收前端個人網站傳來的對話紀錄 (包含思考歷程 reasoning_details)。
 * 2. 從「指令碼屬性 (Script Properties)」安全讀取 OPENROUTER_API_KEY。
 * 3. 呼叫 OpenRouter API (使用 anthropic/claude-haiku-5.5 模型並啟用 reasoning)。
 * 4. 將生成的回答與 reasoning_details 回傳給前端。
 * 
 * 【設定步驟】：
 * 1. 前往 Google Apps Script (https://script.google.com/)，新增專案。
 * 2. 將本檔案內容完整複製並貼到 Code.gs。
 * 3. 設定 Key（兩種方式擇一）：
 *    - 方式 A (最快)：在上方工具列選擇「setupApiKey」函式，點擊「執行」即可自動寫入！
 *    - 方式 B：點擊左側齒輪「專案設定」 -> 往下滑至「指令碼屬性」 -> 新增屬性：
 *             屬性名稱：OPENROUTER_API_KEY
 *             屬性值：貼上您的 OpenRouter API Key (sk-or-v1-...)
 * 4. 點擊右上角「部署 (Deploy)」 -> 「新增部署作業 (New deployment)」：
 *    - 種類選擇：「網頁應用程式 (Web App)」
 *    - 執行身分 (Execute as)：「我 (Me)」
 *    - 誰可以存取 (Who has access)：「所有人 (Anyone)」⚠️ 非常重要，請務必選 Anyone！
 * 5. 點擊「部署」，複製產生的「網頁應用程式網址 (Web App URL)」(結尾為 /exec)。
 * 6. 回到個人網站右下角小客服，點擊「⚙️ 設定鈕」，貼上該網址並儲存即可開始對話！
 */

// ==========================================
// 1. 快捷設定 API KEY 工具函式（直接點擊「執行」即可）
// ==========================================
function setupApiKey() {
  // 請在此填入您的 OpenRouter API Key，然後點擊上方「執行」
  const apiKey = "YOUR_OPENROUTER_API_KEY_HERE";
  PropertiesService.getScriptProperties().setProperty("OPENROUTER_API_KEY", apiKey);
  Logger.log("✅ 成功將 OPENROUTER_API_KEY 設定到指令碼屬性中！");
}

// ==========================================
// 2. HTTP GET 請求（健康檢查與連線測試）
// ==========================================
function doGet(e) {
  const output = {
    status: "ok",
    message: "Google Apps Script AI Chatbot API is online and ready!",
    timestamp: new Date().toISOString()
  };
  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// 3. HTTP POST 請求（處理前端對話請求）
// ==========================================
function doPost(e) {
  try {
    // 1. 取得指令碼屬性中的 API KEY
    const apiKey = PropertiesService.getScriptProperties().getProperty("OPENROUTER_API_KEY");
    if (!apiKey) {
      return createJsonResponse({
        error: "尚未在 GAS 指令碼屬性中設定 OPENROUTER_API_KEY。請先執行 setupApiKey() 函式或至專案設定中配置。"
      });
    }

    // 2. 解析前端傳入的 JSON 資料
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({
        error: "無效的請求：未收到 postData 內容。"
      });
    }

    const requestData = JSON.parse(e.postData.contents);
    const clientMessages = requestData.messages || [];
    const model = requestData.model || "anthropic/claude-haiku-5.5";

    // 3. 定義 Leo Chen 個人網站專屬 System Prompt（背景人設與知識）
    const systemPrompt = {
      role: "system",
      content: [
        "你是由 Leo Chen 設計並代表其個人網站的 AI 智慧客服特助。",
        "【Leo Chen 背景資訊】",
        "- 職位：AI 解決方案架構師 (AI Solutions Architect) & 全端工程師 (Full-Stack Engineer)",
        "- 經驗：5 年以上軟體研發經驗，主導超過 30 個生成式 AI、自動化與雲端專案",
        "- 核心技術：OpenRouter, Claude, GPT-4, Reasoning, RAG 知識庫, TypeScript, React, Vue, Tailwind CSS, Python, FastAPI, Google Apps Script (GAS), Docker, GitHub Pages",
        "- 專長風格：架構清晰、注重使用者體驗、能快速將生成式 AI 落地到真實業務場景",
        "- 聯絡信箱：contact@leo-chen.dev",
        "【你的回覆原則】",
        "1. 請始終使用親切、專業、結構清晰的「繁體中文」回答。",
        "2. 當訪客詢問 Leo 的專長、專案或經歷時，給予清楚詳細的說明；若訪客想尋求合作或委託，主動引導其透過信箱聯絡。",
        "3. 保持回答簡潔精煉，避免冗長無重點的廢話。"
      ].join("\n")
    };

    // 4. 組裝對話歷史，並確保 System Prompt 置於最前方
    let messagesToSend = [];
    const hasSystemMessage = clientMessages.some(m => m.role === "system");
    if (!hasSystemMessage) {
      messagesToSend.push(systemPrompt);
    }
    
    // 清理與組裝訊息格式，保留 reasoning_details 以支援連續思考推理
    clientMessages.forEach(m => {
      const msgObj = {
        role: m.role,
        content: m.content
      };
      if (m.reasoning_details) {
        msgObj.reasoning_details = m.reasoning_details;
      }
      messagesToSend.push(msgObj);
    });

    // 5. 準備呼叫 OpenRouter API 的 Payload
    const openRouterUrl = "https://openrouter.ai/api/v1/chat/completions";
    const payload = {
      model: model,
      messages: messagesToSend,
      reasoning: { enabled: true }
    };

    const options = {
      method: "post",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://leo30863232956712-creator.github.io",
        "X-Title": "Leo Chen Personal Portfolio AI Assistant"
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    // 6. 發送 HTTP 請求至 OpenRouter
    const response = UrlFetchApp.fetch(openRouterUrl, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    const responseData = JSON.parse(responseText);

    // 7. 檢查 API 回應是否出錯
    if (responseCode !== 200 || responseData.error) {
      const errorMsg = responseData.error ? (responseData.error.message || JSON.stringify(responseData.error)) : ("HTTP 狀態碼: " + responseCode);
      return createJsonResponse({
        error: "OpenRouter API 錯誤: " + errorMsg
      });
    }

    // 8. 擷取生成結果與 reasoning_details
    const choice = responseData.choices && responseData.choices[0];
    if (!choice || !choice.message) {
      return createJsonResponse({
        error: "OpenRouter 未回傳有效的選擇內容。"
      });
    }

    const assistantMessage = choice.message;
    return createJsonResponse({
      success: true,
      content: assistantMessage.content || "",
      reasoning_details: assistantMessage.reasoning_details || null
    });

  } catch (error) {
    return createJsonResponse({
      error: "GAS 後端執行異常: " + error.toString()
    });
  }
}

// 輔助函式：建立標準 JSON HTTP 回應
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
