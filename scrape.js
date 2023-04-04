// read file
const fs = require('fs');
const { exit } = require('process');
const request = require('request');
const path = require('path');
const file = fs.readFileSync('test.html', 'utf8');

// split file into array of lines
const lines = file.split('\n');

let urls = [];

lines.forEach((line) => {
    const ary = line.split('"');
    for (let i = 0; i < ary.length; i++) {
        if (ary[i].includes('http')) {
            urls.push(ary[i]);
        }
    }
});

//file name generate
let filenames = [];
urls.forEach((url) => {
    filenames.push(url.split('/').pop());
});

//check if urls.length === filenames.length
if (urls.length === filenames.length) {
    console.log('lengths match');
} else {
    console.log('lengths do not match');
    exit();
}

//download files with time bound

const timebound = 1000; //(ms)
const directory = './out';

const fetchWithTimebound = async (
    urls,
    filenames,
    timebound,
    directory = ''
) => {
    for (let i = 0; i < urls.length; i++) {
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

fetchWithTimebound(urls, filenames, timebound, directory);
