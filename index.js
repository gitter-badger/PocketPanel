'use strict';

const util = require('util')
const fs = require('fs-extra');
const os = require('os');
const crypto = require('crypto');

global.path = __dirname;
global.log = {pocketpanel: require('logging').default('PocketPanel')};

global.log.pocketpanel.info('PocketPanel is starting up...');

// Ensure that the environment file exists before attempting to load it.
if(!fs.existsSync(`${global.path}/.env`)) fs.copySync(`${global.path}/env_template`, `${global.path}/.env`);

// Check if the system is running in development mode and if it isn't, ensure that the env file is up-to-date.
if(!fs.existsSync(`${global.path}/.develop`)) {
    global.isDev = false;

    let oldEnv = fs.readFileSync(`${global.path}/.env`);
    let newEnv = fs.readFileSync(`${global.path}/env_template`);

    if(crypto.createHash('md5').update(oldEnv, 'utf8').digest('hex') !== crypto.createHash('md5').update(newEnv, 'utf8').digest('hex')) {
        global.log.pocketpanel.info('Updating environment file.');
        fs.copySync(`${global.path}/env_template`, `${global.path}/.env`);
    }
} else {
    global.isDev = true;
}

require('dotenv').config();

switch(process.platform.toString().toUpperCase()) {
    case 'DARWIN':
        global.os = 'mac';
    break;

    case 'OPENBSD':
    case 'FREEBSD':
        global.os = 'bsd';
    break;

    case 'LINUX':
        global.os = 'linux';
    break;

    case 'WIN32':
        global.os = 'windows';
    break;

    default:
        global.log.error('Unsupported operating system detected.');
        process.exit(1);
}

if(global.os !== undefined) {
    global.log.pocketpanel.info(`OS detected: ${global.os}`);
}

// Create internal data folder if it does not exist.
if(!fs.existsSync(`${global.path}/.pocketpanel`)) fs.mkdirSync(`${global.path}/.pocketpanel`);

const configManager = new (require('./app/config/ConfigManager'));

configManager.wait().then(config => {
    global.config = config;
    new (require('./pocketpanel'))();
});
