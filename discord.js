const {
    Client,
    GatewayIntentBits,
    SelectMenuOptionBuilder,
} = require('discord.js');
const toml = require('toml');
const fs = require('fs');
const config = toml.parse(fs.readFileSync('./discord.toml', 'utf8'));

console.log(config.token);
// execuse command once with a discord.js

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', (message) => {
    if (message.content === 'here') {
        message.reply('OK');
        // start send
        (async () => {
            const channel = message.channel;
            const files = fs.readdirSync('./out');
            //split for file size limit
            // 7MB
            let sections = [];
            let nowSize = 0;
            let section = [];
            for (let i = 0; i < files.length; i++) {
                section.push('./out/' + files[i]);
                nowSize += fs.statSync('./out/' + files[i]).size;
                if (nowSize > 7000000 || section.length == 10) {
                    sections.push(section);
                    nowSize = 0;
                    section = [];
                }
            }
            for (let i = 0; i < sections.length; i++) {
                await channel.send({
                    files: sections[i],
                });
                //sleep 1s
                await new Promise((resolve) => setTimeout(resolve, 500));
            }
            channel.send('done');
        })();
    }
});

client.login(config.token);
