const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

puppeteer.use(StealthPlugin());

// 配置選項
const CONFIG = {
  CACHE_PATH: path.join(__dirname, '../caches/'),
  BROWSER_LIFETIME: 1000 * 60 * 60, // 瀏覽器實例生命週期（1小時）
  CACHE_LIFETIME: 1000 * 60 * 30,   // 緩存生命週期（30分鐘）
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
    this.pages = new Map(); // 頁面緩存，key 為頁面標識
    this.initPromise = this._ensureFolders();
  }

  async _ensureFolders() {
    // 確保必要的目錄存在
    const dirs = [CONFIG.CACHE_PATH];
    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true }).catch(() => {});
    }
  }

  async getBrowser() {
    await this.initPromise;

    // 如果瀏覽器不存在或超過生命週期，則創建新的瀏覽器
    if (!this.browser || Date.now() - this.lastUsed > CONFIG.BROWSER_LIFETIME) {
      if (this.browser) {
        console.log('瀏覽器實例超過生命週期，關閉並重新創建...');
        await this.closeBrowser();
      }

      console.log('啟動新的瀏覽器實例...');
      this.browser = await puppeteer.launch({
        headless: true, // 建議開發時設為 false，生產環境可設為 true
        userDataDir: CONFIG.USER_DATA_DIR, // 持久化用戶配置文件
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-infobars',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--window-size=1920x1080',
          '--disable-features=IsolateOrigins,site-per-process', // 可能幫助繞過一些檢測
        ]
      });

      // 監聽瀏覽器關閉事件
      this.browser.on('disconnected', () => {
        console.log('瀏覽器意外斷開連接');
        this.browser = null;
      });
    }

    this.lastUsed = Date.now();
    return this.browser;
  }

  async getPage(pageId = 'default') {
    const browser = await this.getBrowser();

    // 檢查是否有可用的頁面緩存
    if (this.pages.has(pageId) && !this.pages.get(pageId).isClosed()) {
      console.log(`使用緩存的頁面: ${pageId}`);
      return this.pages.get(pageId);
    }

    // 創建並配置新頁面
    console.log(`創建新頁面: ${pageId}`);
    const page = await browser.newPage();

    // 設置隨機 User-Agent
    const userAgent = CONFIG.ROTATE_USER_AGENTS[Math.floor(Math.random() * CONFIG.ROTATE_USER_AGENTS.length)];
    await page.setUserAgent(userAgent);

    // 加載該域名的 cookies（如果有）
    try {
      await this.loadCookiesForPage(page, pageId);
    } catch (e) {
      console.log(`無法加載 cookies: ${e.message}`);
    }

    // 設置視窗大小
    await page.setViewport({ width: 1920, height: 1080 });

    // 配置瀏覽器環境
    await page.evaluateOnNewDocument(() => {
      // 偽裝 WebDriver
      Object.defineProperty(navigator, 'webdriver', { get: () => false });

      // 偽裝 Chrome
      window.chrome = {
        runtime: {},
        loadTimes: function() {},
        csi: function() {},
        app: {}
      };

      // 修改 Navigator 屬性
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );
    });

    // 保存頁面到緩存
    this.pages.set(pageId, page);
    return page;
  }

  async saveCookiesForPage(page, pageId) {
    await this.initPromise;
    const cookies = await page.cookies();
    const cookiePath = path.join(CONFIG.CACHE_PATH, `${pageId}.json`);
    await fs.writeFile(cookiePath, JSON.stringify(cookies, null, 2));
    console.log(`已保存 Cookies 至: ${cookiePath}`);
  }

  async loadCookiesForPage(page, pageId) {
    await this.initPromise;
    const cookiePath = path.join(CONFIG.CACHE_PATH, `${pageId}.json`);

    try {
      const cookieData = await fs.readFile(cookiePath, 'utf8');
      const cookies = JSON.parse(cookieData);
      if (cookies && cookies.length > 0) {
        for (const cookie of cookies) {
          await page.setCookie(cookie);
        }
        console.log(`已加載 ${cookies.length} 個 Cookies 從: ${cookiePath}`);
      }
    } catch (e) {
      if (e.code !== 'ENOENT') {
        throw e;
      }
      console.log(`未找到 Cookies 文件: ${cookiePath}`);
    }
  }

  async closePage(pageId = 'default') {
    if (this.pages.has(pageId)) {
      const page = this.pages.get(pageId);
      if (!page.isClosed()) {
        await page.close();
      }
      this.pages.delete(pageId);
      console.log(`已關閉頁面: ${pageId}`);
    }
  }

  async closeBrowser() {
    if (this.browser) {
      // 關閉所有頁面
      for (const [pageId, page] of this.pages.entries()) {
        if (!page.isClosed()) {
          await page.close().catch(() => {});
        }
      }
      this.pages.clear();

      // 關閉瀏覽器
      await this.browser.close().catch(() => {});
      this.browser = null;
      console.log('已關閉瀏覽器實例');
    }
  }
}

// 緩存管理類
class CacheManager {
  constructor() {
    this.initPromise = this._ensureFolder();
  }

  async _ensureFolder() {
    await fs.mkdir(CONFIG.CACHE_PATH, { recursive: true }).catch(() => {});
  }

  _getCacheKey(url, params = {}) {
    // 創建一個包含 URL 和參數的唯一緩存鍵
    const data = JSON.stringify({ url, params });
    return crypto.createHash('md5').update(data).digest('hex');
  }

  async get(url, params = {}) {
    await this.initPromise;
    const cacheKey = this._getCacheKey(url, params);
    const cachePath = path.join(CONFIG.CACHE_PATH, `${cacheKey}.json`);

    try {
      const cacheData = await fs.readFile(cachePath, 'utf8');
      const cache = JSON.parse(cacheData);

      // 檢查緩存是否過期
      if (cache.timestamp + CONFIG.CACHE_LIFETIME > Date.now()) {
        console.log(`從緩存獲取數據: ${url}`);
        return cache.data;
      } else {
        console.log(`緩存已過期: ${url}`);
        return null;
      }
    } catch (e) {
      if (e.code !== 'ENOENT') {
        console.error(`讀取緩存錯誤: ${e.message}`);
      }
      return null;
    }
  }

  async set(url, params = {}, data) {
    await this.initPromise;
    const cacheKey = this._getCacheKey(url, params);
    const cachePath = path.join(CONFIG.CACHE_PATH, `${cacheKey}.json`);

    const cacheData = {
      url,
      params,
      timestamp: Date.now(),
      data
    };

    await fs.writeFile(cachePath, JSON.stringify(cacheData, null, 2));
    console.log(`數據已緩存: ${url}`);
  }

  async clear() {
    await this.initPromise;
    const files = await fs.readdir(CONFIG.CACHE_PATH);

    for (const file of files) {
      if (file.endsWith('.json')) {
        await fs.unlink(path.join(CONFIG.CACHE_PATH, file));
      }
    }

    console.log('已清空緩存');
  }
}

// 主要功能函數
async function bypassCloudflare(url, useCache = false) {
  const pageId = url.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
  console.log(`正在嘗試訪問: ${url}`);

  // 檢查緩存
  if (useCache) {
    const cachedData = await cacheManager.get(url);
    if (cachedData) {
      return cachedData;
    }
  }

  try {
    // 獲取或創建頁面
    const page = await browserManager.getPage(pageId);

    // 監控控制台消息以便調試
    page.on('console', msg => console.log(`頁面日誌(${pageId}):`, msg.text()));

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

    // 保存 cookies 以便下次使用
    await browserManager.saveCookiesForPage(page, pageId);

    const result = {
      success: true,
      pageId,
      pageContent
    };

    // 緩存結果
    if (useCache) {
      await cacheManager.set(url, {}, result);
    }

    return result;
  } catch (error) {
    console.error(`訪問過程中發生錯誤(${pageId}):`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

// API 請求功能函數
async function fetchAPI(pageId, url, method, headers, params = {}, useCache = false) {
  // 檢查緩存
  if (useCache) {
    const cachedData = await cacheManager.get(url, params);
    if (cachedData) {
      return cachedData;
    }
  }

  try {
    const page = await browserManager.getPage(pageId);
    const result = await page.evaluate(async (url, params, method, headers) => {
      try {
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
      } catch (error) {
        return {
          success: false,
          error: error.toString()
        };
      }
    }, url, params, method, headers);

    // 保存 cookies
    await browserManager.saveCookiesForPage(page, pageId);

    // 緩存結果
    if (useCache) {
      await cacheManager.set(url, params, result);
    }

    return result;
  }
  catch (error) {
    console.error(`API 請求錯誤:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 創建全局單例
const browserManager = new BrowserManager();
const cacheManager = new CacheManager();

// 提供給外部使用的 API
module.exports = {
  bypassCloudflare,
  fetchAPI
};

