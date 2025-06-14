const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('walletconnect')
    .setDescription('設定你的錢包地此'),
  async execute(interaction) {
    const walletConnectBtn = new ButtonBuilder()
      .setCustomId('walletconnect') // btn id
      .setLabel('Connect Wallet')
      .setStyle('Primary')
      .setEmoji('🔗');
    const row = new ActionRowBuilder()
      .addComponents(walletConnectBtn)
    await interaction.reply({
      components: [row]
    });
  },
  async buttonEvent(interaction) {
    // 檢查命令是否存在
    const modal = new ModalBuilder()
      .setCustomId('walletconnect')
      .setTitle('Connect Your Wallet');

    const walletInput = new TextInputBuilder()
      .setCustomId('walletAddress')
      .setLabel('Henesys 錢包地址')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const firstActionRow = new ActionRowBuilder().addComponents(walletInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
  },
  async modelEvent(interaction) {
    // 取的 guild client user id
    const walletAddress = interaction.fields.getTextInputValue('walletAddress');
    const userId = interaction.user.id;


    // 儲存在 key-value 資料庫中
  }
}
