const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('node:fs').promises;
const path = require('node:path');
const crypto = require('node:crypto');

puppeteer.use(StealthPlugin());

// 配置選項
const CONFIG = {
  BROWSER_LIFETIME: 1000 * 60 * 60, // 瀏覽器實例生命週期（1小時）
  ROTATE_USER_AGENTS: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 Edg/117.0.2045.47'
  ]
};

// 瀏覽器管理類
class BrowserManager {
  constructor() {
    this.browser = null;
    this.lastUsed = null;
    this.pages = new Map();
  }

  async getBrowser() {
    // 如果瀏覽器不存在或超過生命週期，則創建新的瀏覽器
    if (!this.browser) {
      if (Date.now() - this.lastUsed > CONFIG.BROWSER_LIFETIME)
      {
        console.log('瀏覽器實例超過生命週期，關閉並重新創建...');
        await this.closeBrowser();
      }
      else {
        console.log('使用現有的瀏覽器實例');
        this.lastUsed = Date.now();
        return this.browser;
      }
    }

    console.log('啟動新的瀏覽器實例...');
    this.browser = await puppeteer.launch({
      headless: true, // 建議開發時設為 false，生產環境可設為 true
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-infobars',
        '--disable-dev-shm-usage'
      ]
    });

    // 監聽瀏覽器關閉事件
    this.browser.on('disconnected', () => {
      console.log('瀏覽器意外斷開連接');
      this.browser = null;
    });

    this.lastUsed = Date.now();
    return this.browser;
  }

  async getPage(url) {
    const pageId = url.replace(/[^a-z0-9]/gi, '_').substring(0, 50);

    if (this.pages.has(pageId)) {
      console.log(`已存在頁面: ${pageId}`);
      return this.pages.get(pageId);
    }

    if (!this.browser) {
      console.log('瀏覽器實例不存在，正在創建...');
      await this.getBrowser();
    }

    try {
      // 創建並配置新頁面
      console.log(`創建新Page頁面: ${pageId}`);
      const page = await this.browser.newPage();

      // 監控控制台消息以便調試
      page.on('console', msg => console.log(`頁面日誌(${pageId}):`, msg.text()));

      // 設置隨機 User-Agent
      const userAgent = CONFIG.ROTATE_USER_AGENTS[Math.floor(Math.random() * CONFIG.ROTATE_USER_AGENTS.length)];
      await page.setUserAgent(userAgent);
      await page.setViewport({ width: 1280, height: 800 });

      // 模仿人類行為
      await page.evaluateOnNewDocument(() => {
        // 隨機延遲模擬人類行為
        const delay = Math.floor(Math.random() * 2000) + 1000; // 1-3秒
        return new Promise(resolve => setTimeout(resolve, delay));
      });
      await page.mouse.move(Math.random(), Math.random());
      await page.mouse.click(Math.random(), Math.random());

      // 訪問頁面
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 15000
      });

      // 檢測是否需要解決 Cloudflare 挑戰
      const pageUrl = await page.url();
      const pageContent = await page.content();
      if (pageUrl.includes('challenge') || pageContent.includes('cf-browser-verification')) {
        console.log('檢測到 Cloudflare 挑戰，等待解決...');

        // 等待挑戰完成
        await page.waitForNavigation({
          waitUntil: 'networkidle0',
          timeout: 30000
        }).catch(e => console.log('等待超時，可能已繞過或失敗'));
      }

      // 抓取頁面內容
      console.log('當前頁面URL:', pageUrl);
      console.log('成功訪問頁面內容長度:', pageContent.length);
      this.pages.set(pageId, page);
      return page;
    } catch (e) {
      throw new Error(`無法創建或訪問頁面: ${e.message}`);
    }
  }

  async pageCallApi(page, url, method, headers, params = {}) {
    try {
      const result = await page.evaluate(async (url, params, method, headers) => {
        const response = await fetch(url, {
          method,
          headers,
          body: method !== 'GET' ? JSON.stringify(params) : undefined,
        });
        const data = await response.json();
        return {
          success: response.ok,
          status: response.status,
          data,
          headers: Object.fromEntries([...response.headers])
        };
      }, url, params, method, headers);
      return result;
    }
    catch (error) {
      console.error(`API 請求錯誤: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async closePage(url) {
    const pageId = url.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
    if (this.pages.has(pageId)) {
      const page = this.pages.get(pageId);
      await page.close();
    }
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close().catch(() => {});
    }
  }
}

// 創建全局單例
const browserManager = new BrowserManager();

// 提供給外部使用的 API
module.exports = {
  browserManager
};

