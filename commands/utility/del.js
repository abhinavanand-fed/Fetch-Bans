const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('deletecommand')
		.setDescription('Deletes a specified slash command.')
		.addStringOption(option =>
			option.setName('command_name')
				.setDescription('Name of the command to delete.')
				.setRequired(true)),
	async execute(interaction) {
		const commandName = interaction.options.getString('command_name');
		const { commands } = interaction.client;
		
		// Find the command with the specified name
		const command = commands.get(commandName);
		
		if (!command) {
			await interaction.reply(`Command "${commandName}" not found.`);
			return;
		}
		
		// Delete the command
		commands.delete(commandName);
		
		await interaction.reply(`Command "${commandName}" has been deleted.`);
	},
};
