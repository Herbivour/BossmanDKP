// Filename matches the command portion of the bot's ! commands
const db = require('../models');
const { exec } = require("child_process");
const DiscordVoice = require('./lib/discord_voice');
const handlers = {};
const botOwnerId = process.env.BOSSMAN_ONWER_ID;

const { RecalculateCachedValues } = require('./lib/raid_helpers');

async function join(msg) {
  if(!msg.member.roles.cache.find(r => r.name === "DKP Officer")) {
    msg.reply('Only DKP Officers can do this!');
    return;
  }
  const voiceChannel = msg.member.voice.channel;
  const connection = await voiceChannel.join();
  DiscordVoice.SetConnection(connection);
  DiscordVoice.Speak("What is up my homies");
}

async function leave(msg) {
  if(!msg.member.roles.cache.find(r => r.name === "DKP Officer")) {
    msg.reply('Only DKP Officers can do this!');
    return;
  }
  DiscordVoice.Leave();
}

async function speak(msg) {
  if(msg.author.id !== botOwnerId) {
    msg.reply('Sorry, only Herbivour can do this action');
    return;
  }
  msg.content = msg.content.replace(/\s*speak\s*/i, '');
  msg.content = msg.content.replace(/\s*$/i, '');
  DiscordVoice.Speak(msg.content);
}
async function attendance(msg) {
  if(!msg.member.roles.cache.find(r => r.name === "DKP Officer")) {
    msg.reply('Only DKP Officers can do this!');
    return;
  }
  const voiceConn = DiscordVoice.GetConnection();
  const members = voiceConn.channel.members;
  const names = members.map((m)=> {
    return m.nickname || m.user.username
  }).map((n) => { 
    return n.match(/\s*(\w+)/i)[1];
  });
  const raidName = msg.content || 'Raid';
  const ra = !Boolean(msg.content.match(/nora/i));
  const now = new Date();
  const raid = await db.Raid.create({
    note: raidName,
    isAttendance: ra,
    when: now,
    value: 20
  });
  for(const characterName of names) {
    const user = await db.User.findOne({
      where: {characterName: characterName}
    });

    if (user) {
      const values = {
        UserId: user.id,
        RaidId: raid.id
      };
      await db.UserRaidAttendance.findOrCreate({
        where: values,
        defaults: values
      });
    }
    
  }
  await RecalculateCachedValues();
  DiscordVoice.QueueFile(__dirname + '/../audio/register.wav');
}

async function usage(msg) {
console.log("usage")
console.log("author id: ", msg.author.id)
console.log("Owner ID: ", botOwnerId)
  if(msg.author.id !== botOwnerId) {
    msg.reply('Sorry, only Herbivour can do this action');
    return;
  }
  exec(
    `du -h ${__dirname + '/../audio'}`,
    (error, stdout, stderr) => {
      if (error) {
        msg.reply(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        msg.reply(`stderr: ${stderr}`);
        return;
      }
      msg.reply(`stdout: ${stdout}`);
    }
  );
  exec(
    `df -h`,
    (error, stdout, stderr) => {
      if (error) {
        msg.reply(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        msg.reply(`stderr: ${stderr}`);
        return;
      }
      msg.reply(`stdout: ${stdout}`);
    }
  );
}
const bq = "```";

function help(msg) {
  msg.reply(`!dkp_voice commands:\n
DKP Officer commands:
${bq}!dkp_voice join${bq}
Tells Bossman to join your voice channel.

${bq}!dkp_voice leave${bq}
Tells Bossman to leave your voice.

${bq}!dkp_voice attendance Raid note${bq}
Takes a DKP dump using discord names, the names need to start with the main character name.

${bq}!dkp_voice attendance Raid note nora${bq}
(No RA) Takes a DKP dump using discord names, the names need to start with the main character name.
`);
}


handlers.join = join;
handlers.leave = leave;
handlers.speak = speak;
handlers.usage = usage;
handlers.attendance = attendance;
handlers.help = help;
module.exports = handlers;
