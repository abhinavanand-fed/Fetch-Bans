require('dotenv').config();

const { Client, Intents, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_BANS] });

client.once('ready', () => {
    console.log('Bot is ready!');
    client.application.commands.create({
        name: 'fetchbans',
        description: 'Fetches banned members with a specific reason',
        options: [
            {
                name: 'reason',
                description: 'The specific reason for the ban',
                type: 'STRING',
                required: true
            }
        ]
    });
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'fetchbans') {
        const guild = interaction.guild;
        const bans = await guild.bans.fetch();
        const bannedMembers = bans.map(ban => {
            return {
                user: ban.user.tag,
                userId: ban.user.id,
                reason: ban.reason || 'No reason provided'
            };
        });

        const specificReason = options.getString('reason');
        const specificBans = bannedMembers.filter(ban => ban.reason === specificReason);

        if (specificBans.length > 0) {
            const embed = new MessageEmbed()
                .setTitle(`Banned members with reason '${specificReason}'`)
                .setColor('#ff0000')
                .setDescription(`Banned members:\n${specificBans.map(ban => `User: ${ban.user} (${ban.userId}), Reason: ${ban.reason}`).join('\n')}`);

            const row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('unban_all')
                        .setLabel('Unban All')
                        .setStyle('DANGER')
                );

            await interaction.reply({ embeds: [embed], components: [row], ephemeral: false });

            const collector = interaction.channel.createMessageComponentCollector({ componentType: 'BUTTON' });

            collector.on('collect', async button => {
                if (button.customId === 'unban_all') {
                    const promises = specificBans.map(async ban => {
                        try {
                            const user = await client.users.fetch(ban.userId);
                            await guild.members.unban(user.id, 'Unbanned by bot');
                            console.log(`Unbanned user: ${user.tag}`);
                        } catch (error) {
                            console.error(`Error unbanning user: ${ban.user.tag} (${ban.userId}):`, error);
                        }
                    });
                    await Promise.all(promises).catch(console.error); // Add error handling for the unbanning process
                    button.reply({ content: `Unbanned all members with reason '${specificReason}'.`, ephemeral: false }).catch(console.error);
                    button.message.edit({ components: [] }).catch(console.error);
                }
            });

            collector.on('end', () => {
                interaction.editReply({ components: [] }).catch(console.error);
            });
        } else {
            await interaction.reply(`No banned members found with reason '${specificReason}'.`, { ephemeral: false }).catch(console.error);
        }
    }
});
client
    .login(
        process.env.TOKEN
    )
    .catch(console.error);
