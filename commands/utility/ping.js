const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('測試小幫手是否在線'),
	async execute(interaction) {
		await interaction.reply({
			content: 'Pong!',
			flags: MessageFlags.Ephemeral,
		});
	},
};
