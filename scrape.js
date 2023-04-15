// read file
const fs = require('fs');
const fse = require('fs-extra');
const execSync = require('child_process').execSync;
const { exit } = require('process');
const request = require('request');
const path = require('path');
const file = fs.readFileSync('target.html', 'utf8');

//do shell
const shell = (cmd) => {
    return execSync(cmd).toString();
};
// split file into array of lines
const lines = file.split('\n');

let urls = [];

lines.forEach((line) => {
    const ary = line.split('"');
    for (let i = 0; i < ary.length; i++) {
        if (
            ary[i].includes('jpg') ||
            ary[i].includes('png') ||
            ary[i].includes('jpeg')
        ) {
            urls.push(ary[i]);
        }
    }
});

console.log(urls);

//file name generate
let filenames = [];
urls.forEach((url) => {
    filenames.push(url.split('/').pop());
});

console.log(filenames);

//check if urls.length === filenames.length
if (urls.length === filenames.length) {
    console.log('lengths match');
} else {
    console.log('lengths do not match');
    exit();
}

//download files with time bound

const timebound = 500; //(ms)
const directory = './out';

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

//fetchWithTimebound(urls, filenames, timebound, directory);

export default fetchWithTimebound;