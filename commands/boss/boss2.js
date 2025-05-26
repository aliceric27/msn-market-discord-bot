const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder, MessageFlags, WebhookClient } = require('discord.js');
const dotenv = require('dotenv');

// 載入環境變數
dotenv.config();

/**
 * 獲取BOSS通報的Webhook URL
 * @param {number} server - 伺服器編號 (1-3)
 * @returns {object|null} - 返回webhook配置或null
 */
function getBossWebhookUrl(server) {
  const config = {
    1: {
      dcRoleId: '1372770930337775656',
      webhookUrl: process.env.BOSS_WEBHOOK_URL_1
    },
    2: {
      dcRoleId: '1372771580018430053',
      webhookUrl: process.env.BOSS_WEBHOOK_URL_2
    },
    3: {
      dcRoleId: '1372771022809595986',
      webhookUrl: process.env.BOSS_WEBHOOK_URL_3
    },
  };

  return config[server] || null;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('boss2')
    .setDescription('通報2服黑王BOSS')
    .addIntegerOption(option =>
      option
        .setName('channel')
        .setDescription('請輸入頻道號碼1~20')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(20)
    )
    .addAttachmentOption(option =>
      option
        .setName('image')
        .setDescription('上傳圖片')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('text')
        .setDescription('輸入備註')
        .setRequired(false)
    ),

  async execute(interaction) {
    // 獲取用戶提供的頻道參數
    const channel = interaction.options.getInteger('channel');
    const image = interaction.options.getAttachment('image');
    const text = interaction.options.getString('text');

    const server = 2; // 2服
    const customText = text ? `備註: ${text}` : '';

    // 檢查是否上傳的是圖片
    if (!image.contentType.startsWith('image/')) {
      return await interaction.reply({
        content: '😥 請上傳圖片檔案!',
        flags: MessageFlags.Ephemeral
      });
    }

    // 獲取webhook配置
    const webhookConfig = getBossWebhookUrl(server);
    if (!webhookConfig || !webhookConfig.webhookUrl) {
      return await interaction.reply({
        content: `🚫 **錯誤** : 伺服器${server}設定錯誤`,
        flags: MessageFlags.Ephemeral
      });
    }

    // 創建格式化的訊息
    const message = `<@&${webhookConfig.dcRoleId}> 黑王出現!!
**${channel}** 頻道
${customText}`;

    try {
      // 延遲回覆，表示處理中
      await interaction.deferReply({ flags: MessageFlags.Ephemeral});

      // 使用webhook發送訊息
      const webhookClient = new WebhookClient({ url: webhookConfig.webhookUrl });

      const response = await webhookClient.send({
        content: message,
        embeds: [
          new EmbedBuilder()
            .setImage(image.url)
        ],
        wait: true
      });

      // 額外的webhook通知 (如有需要)
      const WEB_HOOK_LIST = {
        1: [],
        2: [process.env.BOSS_WEBHOOK_URL_4],
        3: [],
      };

      if (WEB_HOOK_LIST[server] && WEB_HOOK_LIST[server].length > 0) {
        for (const webhookUrl of WEB_HOOK_LIST[server]) {
          const extraWebhook = new WebhookClient({ url: webhookUrl });
          await extraWebhook.send({
            content: message,
            embeds: [
              new EmbedBuilder()
                .setImage(image.url)
            ]
          });
        }
      }

      // 回應用戶的命令
      return await interaction.editReply({
        content: `已通報${server}服黑王出現`,
        flags: MessageFlags.Ephemeral
      });
    } catch (error) {
      console.error(`處理伺服器${server}黑王通報時出錯:`, error);
      return await interaction.editReply({
        content: `🚫 **錯誤** : 處理伺服器${server}黑王通報時出錯`,
        flags: MessageFlags.Ephemeral
      });
    }
  },
};
