require('dotenv').config();

const { Client, Intents, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_BANS, Intents.FLAGS.GUILD_MESSAGES] });

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

    client.application.commands.create({
        name: 'ping',
        description: 'Check the bot\'s ping'
    });

    client.application.commands.create({
        name: 'userinfo',
        description: 'Show user information based on their Discord user ID',
        options: [
            {
                name: 'user_id',
                description: 'The Discord user ID',
                type: 'STRING',
                required: true
            }
        ]
    });

    /*new cmd*/
    client.application.commands.create({
        name: 'report',
        description: 'Report a player',
        options: [
            {
                name: 'player_id',
                description: 'The ID of the player',
                type: 'STRING',
                required: true
            },
            {
                name: 'player_name',
                description: 'The name of the player',
                type: 'STRING',
                required: true
            },
            {
                name: 'video_link',
                description: 'Link to the video evidence',
                type: 'STRING',
                required: true
            }
        ]
    });
    /*new cmd*/

});



client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    /*new cmd*/
    if (commandName === 'report') {
        const playerId = options.getString('player_id');
        const playerName = options.getString('player_name');
        const videoLink = options.getString('video_link');
    
        // Create a modal for user input
        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('submit_report')
                    .setLabel('Submit Report')
                    .setStyle('PRIMARY')
            );
    
        await interaction.reply({
            content: 'Please confirm the details and submit the report:',
            ephemeral: true,
            components: [row],
            embeds: [
                new MessageEmbed()
                    .setTitle('Report Details')
                    .setColor('#ff0000')
                    .addFields(
                        { name: 'Player ID', value: playerId },
                        { name: 'Player Name', value: playerName },
                        { name: 'Video Link', value: videoLink }
                    )
            ]
        });
    
        const filter = i => i.customId === 'submit_report' && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });
    
        collector.on('collect', async i => {
            const reportEmbed = new MessageEmbed()
                .setTitle('Report')
                .setColor('#ff0000')
                .addFields(
                    { name: 'Submitted by', value: interaction.user.username },
                    { name: 'Player ID', value: playerId },
                    { name: 'Player Name', value: playerName },
                    { name: 'Video Link', value: videoLink }
                );
    
            const channel = client.channels.cache.get('1189856644805443635'); // Channel ID where reports should be sent
            if (channel && channel.isText()) {
                channel.send({ embeds: [reportEmbed] });
            }
    
            await i.update({ content: 'Your report has been submitted.', embeds: [], components: [] });
            collector.stop();
        });
    
        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({ content: 'Report submission timed out.', embeds: [], components: [] });
            }
        });
    }
    /*new cmd*/

    if (commandName === 'userinfo') {
        const userId = options.getString('user_id');
        const user = await client.users.fetch(userId);

        const embed = new MessageEmbed()
            .setTitle('User Information')
            .setColor('#7289DA')
            .addFields(
                { name: 'Username', value: user.username },
                { name: 'Discriminator', value: user.discriminator },
                { name: 'ID', value: user.id }
            )
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .setFooter('Requested by ' + interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true }))
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: false });
    }



    if (commandName === 'ping') {
        const ping = client.ws.ping;
        let color;

        if (ping < 100) {
            color = 'GREEN';
        } else if (ping < 200) {
            color = 'YELLOW';
        } else {
            color = 'RED';
        }

        const embed = new MessageEmbed()
            .setTitle('Bot Ping')
            .setDescription(`The bot's ping is ${ping}ms`)
            .setColor(color);

        await interaction.reply({ embeds: [embed], ephemeral: false });
    }


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
                .setDescription(`Banned members:\n${specificBans.map(ban => `- User: ${ban.user} (${ban.userId}), Reason: ${ban.reason}`).join('\n')}`);

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
