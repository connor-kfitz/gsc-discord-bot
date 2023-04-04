import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import { config } from 'dotenv'

config();

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	],
});

const token = process.env.TOKEN;
const client_id = process.env.CLIENT_ID;
const guild_id = process.env.GUILD_ID;

const rest = new REST({ version: '10' }).setToken(token)


client.login(token)

client.on('ready', () => {
    console.log('Bot has logged in.')
})

client.on('interactionCreate', (intercation) => {
    if (intercation.isChatInputCommand()) {
        console.log('Chat Input Command');
        intercation.reply({ content: 'Music is playing' });
    }
});

async function main() {

    const commands = [
        {
            name: 'play',
            description: 'Play Music'
        }
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

main();