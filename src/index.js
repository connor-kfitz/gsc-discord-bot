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

main();

client.login(token)

client.on('ready', async () => {
    console.log('Bot has logged in.')
})

player.events.on('playerStart', (queue, track) => {
    // we will later define queue.metadata object while creating the queue
    queue.metadata.channel.send(`Started playing **${track.title}**!`);
});

player.on("error", (queue, error) => {
    // console.log(`[${queue.guild.name}] Error emitted from the queue: ${error.message}`);
    console.log('Player Error');
});

client.on('interactionCreate', async (interaction) => {

    const player = useMasterPlayer(); // Get the player instance that we created earlier

    const userId = interaction.user.id;
    const guildId = interaction.member.guild.id;

    console.log("Guild ID Interaction ", userId);

    const channel = getPlaybackChannel(userId, guildId);

    if (!channel) return interaction.reply('You are not connected to a voice channel!'); // make sure we have a voice channel
    const query = interaction.options.getString('query', true); // we need input/query to play
 
    // let's defer the interaction as things can take time to process
    await interaction.deferReply();
    const searchResult = await player.search(query, { requestedBy: interaction.user });
 
    if (!searchResult.hasTracks()) {
        // If player didn't find any songs for this query
        await interaction.editReply(`We found no tracks for ${query}!`);
        return;
    } else {
        try {
            await player.play(channel, searchResult, {
                nodeOptions: {
                    metadata: interaction // we can access this metadata object using queue.metadata later on
                }
            });
            await interaction.editReply(`Loading your track`);
        } catch (e) {
            // let's return error if something failed
            return interaction.followUp(`Something went wrong: ${e}`);
        }
    }
});

async function main() {

    const commands = [
        {
            name: "play",
            description: "Plays a song from youtube",
            options: [
                {
                    name: "query",
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