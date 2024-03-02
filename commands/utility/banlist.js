const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('banlist')
		.setDescription('Displays a list of banned members in the server.'),
	async execute(interaction) {
		// Fetch the ban list
		const bans = await interaction.guild.bans.fetch();
		
		// Check if there are any bans
		if (bans.size === 0) {
			await interaction.reply('There are no banned members in this server.');
			return;
		}
		
		// Create a list of banned member usernames
		const bannedMembers = bans.map(ban => `${ban.user.username}#${ban.user.discriminator}`).join('\n');
		
		await interaction.reply(`List of banned members:\n${bannedMembers}`);
	},
};
