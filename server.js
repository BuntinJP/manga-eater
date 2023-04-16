const express = require('express');
const toml = require('toml');
const fs = require('fs');
const config = toml.parse(fs.readFileSync('./discord.toml', 'utf8'));
console.log(config.token);
const path = require('path');
const app = express(); const allowCrossDomain = function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
    res.header(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, access_token'
    )

    // intercept OPTIONS method
    if ('OPTIONS' === req.method) {
        res.send(200)
    } else {
        next()
    }
}
const {
    Client,
    GatewayIntentBits,
} = require('discord.js');

const request = require('request');

app.use(allowCrossDomain);

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.listen(3000);
const fetchWithTimebound = async (
    urls,
    filenames,
    timebound,
    directory = ''
) => {
    for (let i = 0; i < urls.length; i++) {
        console.log(`downloaded ${i + 1} of ${urls.length}`);
        request(
            { method: 'GET', url: urls[i], encoding: null },
            (err, res, body) => {
                if (!err && res.statusCode == 200) {
                    fs.writeFileSync(
                        path.join(directory, filenames[i]),
                        body,
                        'binary'
                    );
                }
            }
        );
        await new Promise((resolve) => setTimeout(resolve, timebound));
    }
};

const pushToDiscord = (title, token, channelID, directory) => {
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMembers,
        ],
    });
    client.on('ready', async () => {
        console.log('logged in as ' + client.user.tag);
        // wait one second
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const files = fs.readdirSync(directory);
        //split for file size limit
        // 7MB
        let sections = [];
        let nowSize = 0;
        let section = [];
        //split for files to max 10 or 7MB
        for (let i = 0; i < files.length; i++) {
            console.log('current file: ' + files[i]);
            const current = path.join(directory, files[i]);
            if (
                nowSize + fs.statSync(current).size > 7000000 ||
                section.length == 10
            ) {
                sections.push(section);
                nowSize = 0;
                section = [];
            }
            section.push(current);
            nowSize += fs.statSync(current).size;
            if (i == files.length - 1) {
                sections.push(section);
            }
        }
        const channel = client.channels.cache.get(channelID);
        // create a thread
        const thread = await channel.threads.create({
            name: title,
            autoArchiveDuration: 1440,
        });
        // send files into thread
        for (let i = 0; i < sections.length; i++) {
            await thread.send({
                files: sections[i],
            });
            console.log('send ' + i + ' section');
            console.log(sections[i]);
            //sleep 1s
            await new Promise((resolve) => setTimeout(resolve, 500));
        }
        thread.send('done');
        await new Promise((resolve) => setTimeout(resolve, 15000));
        client.destroy();
        console.log('destroyed');
    });
    client.login(token);
};

app.post('/', async (req, res) => {
    const title = req.body.title;
    const urls = req.body.urls;
    const channelID = "1092900938592829471";
    let filenames = [];
    urls.forEach((url) => {
        filenames.push(url.split('/').pop());
    });
    if (urls.length === filenames.length) {
        console.log('lengths match');
    } else {
        console.log('lengths do not match');
        res.send({ status: 'error', message: 'lengths do not match' });
        return;
    }
    const timebound = 500; //(ms)
    const directory = `./out/${title}`;
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory);
    }
    try {
        await fetchWithTimebound(urls, filenames, timebound, directory);
    } catch (e) {
        console.log(e);
        res.send({ status: 'error', message: "error in fetch" });
        return;
    }
    try {
        pushToDiscord(title, config.token, channelID, directory);
    } catch (e) {
        console.log(e);
        res.send({ status: 'error', message: "error in push" });
        return;
    }
    res.send({ status: 'ok' })
})