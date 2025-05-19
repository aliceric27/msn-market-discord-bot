# 楓之谷宇宙市場助手 (MSU Market Helper)

這是一個專為楓之谷宇宙(MapleStory Universe)遊戲設計的Discord機器人，能夠協助玩家快速查詢遊戲市場上的物品價格資訊。

## 功能特色

- 提供 `query` 指令來查詢市場上最低價格的前五個物品
- 幫助玩家快速比較市場價格，做出更好的交易決策
- 即時獲取市場數據，提供最新的價格信息

## 安裝與設定

### 前置需求

- Node.js
- Discord 帳號與開發者應用程式

### 安裝步驟

1. 複製此專案到本機
   ```
   git clone [repository-url]
   ```

2. 安裝相依套件
   ```
   npm install
   ```

3. 建立 `.env` 檔案
   在專案根目錄建立 `.env` 檔案，並填入以下資訊：
   ```
   DISCORD_TOKEN=你的Discord機器人Token
   CLIENT_ID=你的Discord應用程式ID
   GUILD_ID=你的Discord伺服器ID
   ```

   - `DISCORD_TOKEN`: Discord 機器人的認證令牌
   - `CLIENT_ID`: Discord 應用程式的客戶端 ID
   - `GUILD_ID`: Discord 伺服器的 ID

4. 啟動機器人
   ```
   npm start
   ```

## 使用方法

在 Discord 伺服器中，使用以下指令查詢物品價格：

```
/query [物品塞選]
```

機器人將回傳該物品在市場上最低價格的前五個賣家資訊。

## 貢獻與支援

如果您有任何問題或建議，歡迎提交 Issue 或 Pull Request。


