const { Events, MessageFlags, Collection, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const e = require('express');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
    try {
      if (interaction.isAutocomplete()) {
        // 檢查命令是否存在
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) {
          console.error(`No command matching ${interaction.commandName} was found.`);
          return;
        }

        await command.autocomplete(interaction);
        return;
      }
      else if (interaction.isButton()) {
        // 檢查命令是否存在
        const command = interaction.client.commands.get(interaction.customId);
        if (!command) {
          console.error(`No command matching ${interaction.customId} was found.`);
          return;
        }

        await command.buttonEvent(interaction);
      }
      else if (interaction.isModalSubmit()) {
        // 檢查命令是否存在
        const command = interaction.client.commands.get(interaction.customId);
        if (!command) {
          console.error(`No command matching ${interaction.customId} was found.`);
          return;
        }

        await command.modelEvent(interaction);
      }
      else if (interaction.isChatInputCommand()) {
        // 檢查命令是否存在
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) {
          console.error(`No command matching ${interaction.commandName} was found.`);
          return;
        }
        const { cooldowns } = interaction.client;

        if (!cooldowns.has(command.data.name)) {
          cooldowns.set(command.data.name, new Collection());
        }

        const now = Date.now();
        const timestamps = cooldowns.get(command.data.name);
        const defaultCooldownDuration = 0.5;
        const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1_000;

        if (timestamps.has(interaction.user.id)) {
          const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

          if (now < expirationTime) {
            const expiredTimestamp = Math.round(expirationTime / 1_000);
            return interaction.reply({ content: `哥哥! \`${command.data.name}\`指令別重複這麼快>< . 可以在 <t:${expiredTimestamp}:R> 後使用`, flags: MessageFlags.Ephemeral });
          }
        }
        timestamps.set(interaction.user.id, now);
        setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
        await command.execute(interaction);
      }
    }
    catch (error) {
      console.error('Error in interactionCreate event:', error);
      await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
    }
  }
};
