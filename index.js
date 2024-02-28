require('dotenv').config();

const {
    Client,
    Intents,
    MessageEmbed,
    MessageActionRow,
    MessageButton,
} = require("discord.js");
const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_BANS],
});

client.once("ready", () => {
    console.log("Bot is ready!");
    client.application.commands.create({
        name: 'fetchbans',
        description: 'Fetches banned members with a specific reason or name',
        options: [
            {
                name: 'reason',
                description: 'The specific reason for the ban',
                type: 'STRING',
                required: false
            },
            {
                name: 'name',
                description: 'The specific name of the banned member',
                type: 'STRING',
                required: false
            }
        ]
    });

    client.application.commands.create({
        name: "banlist",
        description: "Shows a list of all banned members",
    });

    client.application.commands.create({
        name: "ping",
        description: "Shows the bot's ping and latency",
    });

    client.application.commands.create({
        name: 'serverinfo',
        description: 'Shows information about the server'
    });

    client.application.commands.create({
        name: 'userinfo',
        description: 'Displays user information'
    });


    /*space for neww cmd*/
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand() || interaction.commandName !== 'fetchbans') return;

    const guild = interaction.guild;
    const bans = await guild.bans.fetch();
    const bannedMembers = bans.map((ban) => {
        return {
            user: ban.user.tag,
            userId: ban.user.id,
            reason: ban.reason || 'No reason provided'
        };
    });

    const specificReason = interaction.options.getString('reason');
    const specificName = interaction.options.getString('name');

    let specificBans;
    if (specificReason) {
        specificBans = bannedMembers.filter((ban) => ban.reason === specificReason);
    } else if (specificName) {
        specificBans = bannedMembers.filter((ban) => ban.user.toLowerCase().includes(specificName.toLowerCase()));
    }

    if (specificBans && specificBans.length > 0) {
        const embed = new MessageEmbed()
            .setTitle(`Banned members with ${specificReason ? `reason '${specificReason}'` : `name '${specificName}'`}`)
            .setColor('#ff0000')
            .setDescription(`Banned members:\n${specificBans.map(ban => `User: ${ban.user} (${ban.userId}), Reason: ${ban.reason}`).join('\n')}`);

        await interaction.reply({ embeds: [embed], ephemeral: false });
    } else {
        await interaction.reply(`No banned members found with ${specificReason ? `reason '${specificReason}'` : `name '${specificName}'`}.`, { ephemeral: true });
    }
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isCommand() || interaction.commandName !== 'userinfo') return;

        const user = interaction.user;
        const embed = new MessageEmbed()
            .setTitle('User Information')
            .setDescription(`Username: ${user.username}\nUser ID: ${user.id}\nAvatar: ${user.displayAvatarURL({ dynamic: true })}`)
            .setColor('#7289DA')
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    });


    if (commandName === 'serverinfo') {
        const guild = interaction.guild;
        // Fetch the owner
        await guild.fetchOwner().then(owner => {
            const ownerName = owner ? owner.user.username : 'Unknown';
            const embed = new MessageEmbed()
                .setTitle('Server Information')
                .setColor('#0099ff')
                .addFields(
                    { name: 'Server Name', value: guild.name },
                    { name: 'Owner', value: ownerName }
                );

            interaction.reply({ embeds: [embed], ephemeral: false }).catch(console.error);
        }).catch(error => {
            console.error('Error fetching owner:', error);
            interaction.reply({ content: 'Error fetching server information.', ephemeral: true }).catch(console.error);
        });
    }

    if (commandName === 'ping') {
        const ping = Date.now() - interaction.createdTimestamp;
        const latency = client.ws.ping;

        await interaction.reply(`🏓 Pong! Bot latency is ${latency}ms. API latency is ${ping}ms.`);
    }

    if (commandName === "banlist") {
        const guild = interaction.guild;
        const bans = await guild.bans.fetch();
        const bannedMembers = bans.map((ban) => {
            return {
                user: ban.user.tag,
                userId: ban.user.id,
                reason: ban.reason || "No reason provided",
            };
        });

        const embed = new MessageEmbed()
            .setTitle("Banned Members")
            .setColor("#ff0000")
            .setDescription(
                `Total Banned Members: ${bannedMembers.length}\n${bannedMembers
                    .map(
                        (ban) => `User: ${ban.user} (${ban.userId}), Reason: ${ban.reason}`
                    )
                    .join("\n")}`
            );

        await interaction
            .reply({ embeds: [embed], ephemeral: false })
            .catch(console.error);
    }

    if (commandName === "fetchbans") {
        const guild = interaction.guild;
        const bans = await guild.bans.fetch();
        const bannedMembers = bans.map((ban) => {
            return {
                user: ban.user.tag,
                userId: ban.user.id,
                reason: ban.reason || "No reason provided",
            };
        });

        const specificReason = options.getString("reason");
        const specificBans = bannedMembers.filter(
            (ban) => ban.reason === specificReason
        );

        if (specificBans.length > 0) {
            const embed = new MessageEmbed()
                .setTitle(`Banned members with reason '${specificReason}'`)
                .setColor("#ff0000")
                .setDescription(
                    `Banned members:\n${specificBans
                        .map(
                            (ban) =>
                                `User: ${ban.user} (${ban.userId}), Reason: ${ban.reason}`
                        )
                        .join("\n")}`
                );

            const row = new MessageActionRow().addComponents(
                new MessageButton()
                    .setCustomId("unban_all")
                    .setLabel("Unban All")
                    .setStyle("DANGER")
            );

            await interaction.reply({
                embeds: [embed],
                components: [row],
                ephemeral: false,
            });

            const collector = interaction.channel.createMessageComponentCollector({
                componentType: "BUTTON",
            });

            collector.on("collect", async (button) => {
                if (button.customId === "unban_all") {
                    const promises = specificBans.map(async (ban) => {
                        try {
                            const user = await client.users.fetch(ban.userId);
                            await guild.members.unban(user.id, "Unbanned by bot");
                            console.log(`Unbanned user: ${user.tag}`);
                        } catch (error) {
                            console.error(
                                `Error unbanning user: ${ban.user.tag} (${ban.userId}):`,
                                error
                            );
                        }
                    });
                    await Promise.all(promises).catch(console.error); // Add error handling for the unbanning process
                    button
                        .reply({
                            content: `Unbanned all members with reason '${specificReason}'.`,
                            ephemeral: false,
                        })
                        .catch(console.error);
                    button.message.edit({ components: [] }).catch(console.error);
                }
            });

            collector.on("end", () => {
                interaction.editReply({ components: [] }).catch(console.error);
            });
        } else {
            await interaction
                .reply(`No banned members found with reason '${specificReason}'.`, {
                    ephemeral: true,
                })
                .catch(console.error);
        }
    }
});

client
    .login(
        process.env.TOKEN
    )
    .catch(console.error);
