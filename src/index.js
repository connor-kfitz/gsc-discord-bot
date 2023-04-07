import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import { Player, useMasterPlayer } from 'discord-player';
import { config } from 'dotenv'
import * as Constants from './constants.js';
import * as Helpers from './helpers.js';

config();

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
	],
});

const token = process.env.TOKEN;
const client_id = process.env.CLIENT_ID;
const guild_id = process.env.GUILD_ID;

const rest = new REST({ version: '10' }).setToken(token)
const player = new Player(client);

var firstPlay = true;

main();

client.login(token)

client.on('ready', async () => {
    console.log(Constants.botReplies.ready)
})

player.events.on('playerStart', (queue, track) => {
    queue.metadata.channel.send(Constants.playerReplies.playerStart[0] + track.title + Constants.playerReplies.playerStart[1]);
});

player.events.on('audioTrackAdd', (queue, track) => {
    if (!firstPlay) {
        queue.metadata.channel.send(Constants.playerReplies.addTrack[0] + track.title + Constants.playerReplies.addTrack[1]);
    }
});

player.events.on('emptyQueue', (queue, track) => {
    firstPlay = true;
    queue.metadata.channel.send(Constants.playerReplies.emptyQueue);
});

player.on("error", (queue, error) => {
    console.log(Constants.playerReplies.error);
});

client.on('interactionCreate', async (interaction) => {

    const player = useMasterPlayer();
    const userId = interaction.user.id;
    const guildId = interaction.member.guild.id;
    const queue = player.nodes.get(guildId);

    if (interaction.commandName === "play") {
        
        const channel = getPlaybackChannel(userId, guildId);

        if (!channel) return interaction.reply(Constants.playerReplies.connectionFailed);
        const search = interaction.options.getString('search', true);
    
        await interaction.deferReply();
        const searchResult = await player.search(search, { requestedBy: interaction.user });
    
        if (!searchResult.hasTracks()) {
            await interaction.editReply(Constants.playerReplies.search[0] + search + Constants.playerReplies.search[1]);
            return;
        } else {
            try {
                await player.play(channel, searchResult, {
                    nodeOptions: {
                        metadata: interaction,
                        channel: interaction.channel,
                        client: interaction.guild.members.me,
                        requestedBy: interaction.user,
                    }
                });
                await interaction.editReply(Constants.playerReplies.loading);
                firstPlay = false;
            } catch (e) {
                return interaction.followUp(Constants.playerReplies.badRequest[0] + e + Constants.playerReplies.badRequest[1]);
            }
        }
    } else if (interaction.commandName === 'queue') {

        if (queue) {
            const trackList = queue.tracks.data.map((item => item.title));
            var trackListString = '';
    
            trackList.map((tracks, index) => {
                trackListString += index + 1 + '. ' + tracks + ' \n'
            })

            await interaction.reply(trackListString)
        } else {
            await interaction.reply(Constants.playerReplies.emptyQueue);

        }
    
    } else if (interaction.commandName === 'skip') {

        if (queue) {
            queue.node.skip();
            await interaction.reply(Constants.playerReplies.skip);
        } else {
            await interaction.reply(Constants.playerReplies.emptyQueue);
        }
        
    } else if (interaction.commandName === 'pause') {

        if (queue) {
            queue.node.pause();
            await interaction.reply(Constants.playerReplies.pause);
        } else {
            await interaction.reply(Constants.playerReplies.emptyQueue);
        }

    } else if (interaction.commandName === 'start') {

        if (queue) {
            queue.node.resume();
            await interaction.reply(Constants.playerReplies.start);
        } else {
            await interaction.reply(Constants.playerReplies.emptyQueue);
        }     
    } else if (interaction.commandName === 'commands') {

        await interaction.reply(returnCommandList());
          
    }
});

async function main() {

    const commands = Constants.commands;

    try {
        console.log(Constants.botReplies.initSlashCommands);

        await rest.put(Routes.applicationGuildCommands(client_id, guild_id), {
            body: commands
        })

    } catch (err) {
        console.log(err);
    }
}

function getPlaybackChannel(userId, guildId) {
    var channelId = '';

    const discordServer = client.guilds.cache.get(guildId);
    
    const channels = discordServer?.channels ? JSON.parse(
        JSON.stringify(discordServer.channels)
    ).guild.channels : [];

    channels.map((channel) => {
        const voiceChannelData = client.channels.cache.get(channel);
        const memberIds = voiceChannelData.members.map(member => member.id);

        memberIds.map((memberId) => {
            if (memberId === userId) {
                channelId = channel;
            }
        })
    })

    return channelId;
}

function returnCommandList() {

    var commandList = '';

    Constants.commands.map((command, index) => {
        commandList += "**" + (index + 1) + '. ' + Helpers.capitalizeFirstLetter(command.name) + '**: ' + command.description +' \n'
    })

    return commandList;
}