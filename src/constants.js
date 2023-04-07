export const commands = [
    {
        name: "play",
        description: "Play a song",
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
        description: "Skip the current song"
    },
    {
        name: "queue",
        description: "View the current queue"
    },
    {
        name: "pause",
        description: "Stop the player"
    },
    {
        name: "start",
        description: "Start the player"
    },
    {
        name: "commands",
        description: "List available commands"
    }
];

export const botReplies = {
    ready: 'Bot has logged in.',
    initSlashCommands: 'Started refreshing application (/) commands.'
}

export const playerReplies = {
    playerStart: ['Started playing ', ' 🎵'],
    loading: '`Loading your track ↻`',
    search: ['We found no tracks for ',  ' 😕'],
    addTrack: ['Added ', ' to the queue 🚶🚶🚶🚶'],
    emptyQueue: `Queue is empty 😔`,
    skip: 'Skipped ⏭️',
    pause : 'Paused ⏸️',
    start: 'Resumed ▶️',
    error: 'Player Error ⚠️',
    connectionFailed: 'You are not connected to a voice channel 🚫',
    badRequest: ['Something went wrong: ', ' ⚠️']
}