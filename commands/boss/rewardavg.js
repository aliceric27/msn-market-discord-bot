const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rewardavg')
    .setDescription('BOSS 獎勵平均分配計算，使用 Wrap 計算，注意: 手續費會浮動，請自行評估使用')
    .addIntegerOption(option =>
      option.setName('人數')
        .setDescription('參與人數')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(6))
    .addNumberOption(option =>
      option.setName('獎勵總額')
        .setDescription('BOSS 獎勵總額(單位: NESO)')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(10000000000))
    .addNumberOption(option =>
      option.setName('基本手續費')
        .setDescription('基本手續費(單位: NXPC)，預設為 0.001')
        .setRequired(false))
    .addNumberOption(option =>
      option.setName('額外手續費')
        .setDescription('額外手續費(單位: NXPC)，預設為 0.025')
        .setRequired(false))
    .addNumberOption(option =>
      option.setName('swaprate')
        .setDescription('NXPC 換 NESO 的比率，預設為 100000')
        .setRequired(false)),
  async execute(interaction) {
    const numPeople = interaction.options.getInteger('人數');
    const totalReward = interaction.options.getNumber('獎勵總額');
    const baseFee = interaction.options.getNumber('基本手續費') || 0.001;
    const extraFee = interaction.options.getNumber('額外手續費') || 0.025;
    const swapRate = interaction.options.getNumber('swaprate') || 100000;

    // 計算每人分配的 NEPC 總額
    const totalRewardToNxpc = totalReward / swapRate;

    // 計算總共的 Fee
    const totalFee = (numPeople - 1) * (baseFee + extraFee);

    // 得到獎池總額
    const wrapTotal = totalRewardToNxpc - totalFee;

    // 每人分配的 Wrap 總額
    const wrapPerPerson = wrapTotal / numPeople;

    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('BOSS 獎勵平均分配計算結果')
      .addFields(
        { name: '參與人數', value: numPeople.toString(), inline: true },
        { name: '總獎勵(NESO)', value: `${totalReward}`, inline: true },
        { name: '總獎勵(NXPC)', value: `${totalRewardToNxpc}`, inline: true },
        { name: '\u200B', value: '\u200B' })
      .addFields(
        { name: '基本手續費(NXPC)', value: `${baseFee}`, inline: true },
        { name: '額外手續費(NXPC)', value: `${extraFee}`, inline: true },
        { name: '手續費總額(NXPC)', value: `${totalFee}`, inline: true },
        { name: '\u200B', value: '\u200B' })
      .addFields(
        { name: '扣除手續費總獎勵(NXPC)', value: `${wrapTotal}`, inline: true },
        { name: '每人分配額度(NXPC)', value: `${wrapPerPerson.toFixed(6)}`, inline: true },
        { name: '\u200B', value: '\u200B' })
      .setFooter({ text: '分配額度(NXPC) = (總獎勵(NXPC) - 總手續費(NXPC) / 參與人數' });


    // 回覆結果
    await interaction.reply({ embeds: [embed] });
  }
}
