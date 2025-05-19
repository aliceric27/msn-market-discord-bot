# 楓之谷宇宙市場DC機器人 (MSN Market Discord Bot)

這是一個專為楓之谷宇宙(MapleStory Universe)遊戲設計的Discord機器人，能夠協助玩家快速查詢遊戲市場上的物品價格資訊。

## 提供指令

- `query` => 指令來查詢市場上最低價格的前五個物品

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

4. 伺服器新增指令
   ```
   node deploy-command.js
   ```
   使用此 script 可以快速在設定 GUILD_ID 的伺服器新增指令

5. 啟動機器人
   ```
   npm start
   ```

## 授權

本專案採用 MIT 授權，詳情請參閱 [LICENSE](LICENSE) 文件。

