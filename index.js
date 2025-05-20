const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const express = require('express');
const app = express();
const { Client, Collection, GatewayIntentBits } = require('discord.js');

// 載入環境變數
dotenv.config();

app.get('/', (req, res) => {
  res.send('Discord 機器人正在運行中!');
});

// 設定健康檢查路由
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'applicate is alive!' });
});

// 啟動 Express 伺服器
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// 設定 Discord Bot 客戶端
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
	partials: ['CHANNEL'],
});

// 設定機器人相關設定
client.commands = new Collection();
client.cooldowns = new Collection();

// 動態載入 commands 資料夾下的所有指令
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		}
		else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// 動態載入 events 資料夾下的所有事件
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	}
	else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

// 設定登入及使用Token
client.login(process.env.DISCORD_TOKEN);
