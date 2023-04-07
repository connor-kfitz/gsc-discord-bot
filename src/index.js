import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import { Player, useMasterPlayer } from 'discord-player';
import { config } from 'dotenv'

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
    console.log('Bot has logged in.')
})

player.events.on('playerStart', (queue, track) => {
    queue.metadata.channel.send(`Started playing ${track.title}!`);
});

player.events.on('audioTrackAdd', (queue, track) => {
    if (!firstPlay) {
        queue.metadata.channel.send(`Added ${track.title} to the queue!`);
    }
});

player.events.on('emptyQueue', (queue, track) => {
    firstPlay = true;
});

player.on("error", (queue, error) => {
    console.log('Player Error');
});

client.on('interactionCreate', async (interaction) => {

    const player = useMasterPlayer(); // Get the player instance that we created earlier
    const userId = interaction.user.id;
    const guildId = interaction.member.guild.id;
    const queue = player.nodes.get(guildId);

    if (interaction.commandName === "play") {
        
        const channel = getPlaybackChannel(userId, guildId);

        if (!channel) return interaction.reply('You are not connected to a voice channel!'); // make sure we have a voice channel
        const search = interaction.options.getString('search', true); // we need input/search to play
    
        await interaction.deferReply();
        const searchResult = await player.search(search, { requestedBy: interaction.user });
    
        if (!searchResult.hasTracks()) {
            await interaction.editReply(`We found no tracks for ${search}!`);
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
                await interaction.editReply(`Loading your track`);
                firstPlay = false;
            } catch (e) {
                return interaction.followUp(`Something went wrong: ${e}`);
            }
        }
    } else if (interaction.commandName === 'queue') {

        const queue = player.nodes.get(guildId);
        const trackList = queue.tracks.data.map((item => item.title));
        var trackListString = '';

        trackList.map((tracks, index) => {
            trackListString += index + 1 + '. ' + tracks + ' \n'
        })
        
        if (trackListString) {
            await interaction.reply(trackListString)
        } else {
            await interaction.reply('No tracks are in the queue');
        }
    
    } else if (interaction.commandName === 'skip') {

        const queue = player.nodes.get(guildId);       
        queue.node.skip();

    } else if (interaction.commandName === 'pause') {

        const queue = player.nodes.get(guildId);       
        queue.node.pause();

    } else if (interaction.commandName === 'start') {

        const queue = player.nodes.get(guildId);       
        queue.node.resume();
    }

});

async function main() {

    const commands = [
        {
            name: "play",
            description: "Plays a song from youtube",
            options: [
                {
                    name: "search",
                    type: 3,
                    description: "The song you want to play",
                    required: true
                }
            ]
        },
        {
            name: "skip",
            description: "Skip to the current song"
        },
        {
            name: "queue",
            description: "See the queue"
        },
        {
            name: "stop",
            description: "Stop the player"
        },
    ];

    try {

        console.log('Started refreshing application (/) commands.');

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