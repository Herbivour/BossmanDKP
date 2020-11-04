const { fork } = require('child_process');
const httpServer = fork(__dirname + '/api/index.js');
const Articles = require('./articles');
var weekday = new Array();
weekday[0] = "Sunday";
weekday[1] = "Monday";
weekday[2] = "Tuesday";
weekday[3] = "Wednesday";
weekday[4] = "Thursday";
weekday[5] = "Friday";
weekday[6] = "Saturday";
const discordBlockQuote = "```";
const db = require('../models');
const { RecalculateCachedValues } = require('./lib/raid_helpers');
db.sequelize.sync();
const axios = require('axios');
const Discord = require('discord.js');
const client = new Discord.Client();
const DiscordVoice = require('./lib/discord_voice');
async function tryTTS(text) {
  try {
    DiscordVoice.Speak(text);
  } catch (err) {
    console.log("Error attempting discord TTS: ", err.message);
  }
}



client.on('ready', () => {
});

const messageHandlers = {};
messageHandlers.ping = function(msg) {
  msg.reply('Pong!');
};
const openBids = {};
function notifyBidStatus(itemName, msg, timeLeft) {
  msg.channel.send(`${discordBlockQuote}ini\n--\nCurrently taking bids on [${itemName}] with [${timeLeft}] seconds remaining.\n--\n${discordBlockQuote}\nPlease message me with the following format to bid:\n\n`);
  msg.channel.send(`!dkp bid item="${itemName}" character="Spongebob" bid="9001"`);
}
function pickWinningBidders(itemName) {
  if(!itemName) { throw new Error('item name required');}
  const lItemName = itemName.toLowerCase();
  let winners = [];
  if(openBids[lItemName]) {
    const bids = [];
    for (const charName in openBids[lItemName].bids) {
      bids.push(openBids[lItemName].bids[charName]);
    }
    if(bids.length === 0) {
      return [];
    }
    bids.sort((a, b) => {
      let comp = b.bid - a.bid;
      if (comp !== 0) {return comp;}
      if (a.ra30day > b.ra30day) { return -1;}
      if (a.ra30day < b.ra30day) { return 1;}
      if (a.ra60day > b.ra60day) { return -1;}
      if (a.ra60day < b.ra60day) { return 1;}
      if (a.ra90day > b.ra90day) { return -1;}
      if (a.ra90day < b.ra90day) { return 1;}
      return 0;
    });
    const bidReportHeading = `Bids for ${itemName}:\n`;
    let bidsText = '';
    for(const bid of bids) {
      const nextLine = `[${bid.characterName}] (${bid.discordName}) - [${bid.bid}]x${bid.bidMultiplyer}, RA: 30: ${bid.ra30day}%, 60: ${bid.ra60day}%, 90: ${bid.ra90day}%\n`;
      if ((bidReportHeading.length + bidsText.length + nextLine.length) > 1200) {
        client.channels.cache.get(process.env.DKP_REPORTING_CHANNEL).send(`${discordBlockQuote}ini\n${bidReportHeading}${bidsText}${discordBlockQuote}`);
        bidsText = '';
      }
      bidsText += nextLine;  
    }
    client.channels.cache.get(process.env.DKP_REPORTING_CHANNEL).send(`${discordBlockQuote}ini\n${bidReportHeading}${bidsText}${discordBlockQuote}`);
    // TODO: Stub this for unit tests
    
    let i=0;
    let cnt = openBids[lItemName].qty || 1;
    let cost = 10;
    for (;i<cnt; i++) {
      const winner = bids.shift();
      if(winner) {
        winners.push(winner);
      }
    }
    
    const next = bids.shift();
    
    if (next) {
      if (next.bid === winners[0].bid) {
        cost = winners[0].bid;
      } else {
        cost = next.bid + 1;
      }
    }
    winners = winners.map((winner) => {
      return {
        characterName: winner.characterName,
        price: cost * winner.bidMultiplyer,
        user: winner.user,
        discordName: winner.discordName,
        bid: winner.bid
      };
    });

  }
  return winners;
}
async function closeBids(itemName, msg) {
  msg.channel.send(`Bids closed on "${itemName}".`);
  const winners = pickWinningBidders(itemName);
  const lItemName = itemName.toLowerCase();
  delete openBids[lItemName];
  if (winners.length === 0) {
    msg.channel.send(`$$$ No bids were recieved for "${itemName}".`);
    tryTTS(`No bids were recieved for ${itemName}.`);
    return;
  }
  for(const winner of winners) {
    const [item, _] = await db.Item.findOrCreate({
      where: {name: itemName},
    });
    const raid = await db.Raid.findOne({
      order:[['createdAt', 'DESC']]
    });
    const uipAttrs = {
      RaidId: raid.id,
      UserId: winner.user.id,
      ItemId: item.id,
      value: winner.price 
    };
    const uip = await db.UserItemPurchase.create(uipAttrs);
    
    winner.user.spentPoints = winner.user.spentPoints + uip.value;
    await winner.user.save();
    msg.channel.send(`${discordBlockQuote}ini\n$$$$$$$$$$\n[${itemName}] goes to [${winner.characterName}] (@${winner.discordName}) for ${winner.price} DKP!\n$$$$$$$$$$\n${discordBlockQuote}`);
    tryTTS(`congratulations to ${winner.characterName} on ${itemName} for ${winner.price} D K P`);
  }
  await RecalculateCachedValues();
}
/*
+------------+
| Class Lead |
| member     |
| Raid Box   |
| Raider     |
| Officer    |
| FNF        |
| Robin Hood |
| Box/Alt    |
| Recruit    |
+------------+
*/
const rankBidCaps = {
  'Raid Box': 100,
  'Recruit': 75,
  'Box/Alt': 50,
  'FNF': 50
};
const bidMultiplyers = {
  'Raid Box': 3,
  'Box/Alt': 3
};
messageHandlers.bid = async function(msg) {
  let itemName = msg.content.match(/item="([^"]+)"/i);
  if (!itemName) {
    msg.reply('Please provide the item name by adding item="<The item Name>"');;
    return;
  }
  itemName = itemName[1];
  const lItemName = itemName.toLowerCase();
  let characterName = msg.content.match(/character="([^"]+)"/i);
  if (!characterName) {
    msg.reply('Please provide the character name by adding character="<Character namee>"');;
    return;
  }
  characterName = characterName[1];

  let bid = msg.content.match(/bid="([^"]+)"/i);
  if (!bid) {
    msg.reply('Please provide the bid ammount name by adding bid="<number>"');;
    return;
  }
  try {
    bid = parseInt(bid[1], 10);
    if (isNaN(bid)) {
      msg.reply('Please provide the bid ammount name by adding bid="<number>"');;
      return;
    }
  } catch (err) {
    msg.reply('The Bid must be a number.');
    return;
  }
  if (bid < 10) {
    msg.reply('Bids must be 10 or higher.');
    return;
  }
  
  if (!openBids[lItemName]) {
    msg.reply(`There are no open bids for "${itemName}`);
    return;
  }
  const user = await db.User.findOne({
    where: {
      characterName: characterName
    }
  });
  if (!user) {
    msg.reply(`Character "${characterName}" not found!`);
    return;
  }
  let maxBid = rankBidCaps[user.rank];
  if (user['30day'] < 40 && (!maxBid || maxBid > 75)) {
    maxBid = 75;
  }
  if (maxBid && (bid > maxBid) ) {
    msg.reply(`Character "${characterName} - ${user.rank} (30 Day RA: ${user['30day']}%) may not bid over ${maxBid}`);
    return;
  }
  let cost = bid;
  const bidMultiplyer = bidMultiplyers[user.rank] || 1;
  if(bidMultiplyer) {
    cost *= bidMultiplyer;
  }
  user.currentPoints = (user.earnedPoints || 0) - (user.spentPoints || 0);
  if (user.currentPoints < cost) {
    if (user.isMain)  {
      msg.reply(`You do not have enough points to bid "${bid}".  Your maximum bid can be ${user.currentPoints}`);
    } else {
      msg.reply(`You do not have enough points to bid "${bid}"x3 (Non-main penalty).  Your maximum bid can be ${user.currentPoints/3}`);
    }
    return;
  }
  let discordName;
  if (msg.member && msg.member.nickname) {
    discordName = msg.member.nickname;
  } else if (msg.author) {
    discordName = msg.author.username;
  }
  openBids[lItemName].bids[characterName.toLowerCase()] = {
    bid: bid,
    characterName: user.characterName,
    discordName: discordName,
    ra30day: user['30day'],
    ra60day: user['60day'],
    ra90day: user['90day'],
    UserId: user.id,
    bidMultiplyer: bidMultiplyer,
    user: user
  };
  msg.reply(`Bid "${bid}" accepted for "${itemName}".`);
};
function startAuction(itemName, qty, msg) {
  const lItemName = itemName.toLowerCase();
  if (openBids[lItemName]) {
    msg.reply('Currently bidding out that item!');
    return;
  }
  openBids[lItemName] = {
    qty: qty,
    bids: {},
    timers: {

    }
  };
  tryTTS(`Now taking bids on ${itemName}`);
  notifyBidStatus(itemName, msg, 180);
  openBids[lItemName].timers.timeLeft120 = setTimeout(
    notifyBidStatus.bind(null, itemName, msg, 120),
    60000
  );
  openBids[lItemName].timers.timeLeft60 = setTimeout(
    notifyBidStatus.bind(null, itemName, msg, 60),
    120000
  );
  openBids[lItemName].timers.timeLeft30 = setTimeout(
    notifyBidStatus.bind(null, itemName, msg, 30),
    150000
  );
  openBids[lItemName].timers.timeLeft0 = setTimeout(
    closeBids.bind(null, itemName, msg),
    180000
  );
}
messageHandlers.auction = function(msg) {
  let qty = 1;
  if(!msg.member.roles.cache.find(r => r.name === "DKP Officer")) {
    msg.reply('Only DKP Officers can do this!');
    return;
  }
  let itemName = msg.content.match(/item="([^"]+)"/);
  if (!itemName) {
    msg.reply('Please provide the item name by adding item="<The item Name>"');;
    return;
  }
  itemName = itemName[1].trim();
  let qtyMatch = msg.content.match(/qty="([^"]+)"/);
  if (qtyMatch) {
    qty = parseInt(qtyMatch[1], 10);
    if (!qty) {
      msg.reply('Please provide a valid quantity: qty="<number>"');;
      return;
    }
  }
  startAuction(itemName, qty, msg);
};
messageHandlers.character = async function (msg) {
  let character = msg.content.match(/^([^\s]+)/);
  if (!character) {
    msg.reply('Please provide a character name.');
    return;
  }
  character = character[1];
  const user = await db.User.findOne({ where: {characterName: character}});
  if (user) {
    msg.reply(`${user.characterName} (${user.className}) - ${(user.earnedPoints || 0) - (user.spentPoints || 0) - (user.wastedPoints || 0)} dkp, 30day: ${user['30day']}%, ID: ${user.id}`);
    return;
  }
  msg.reply(`Character ${character} not found.`);
};
messageHandlers.import = async function(msg) {
  if(!msg.member.roles.cache.find(r => r.name === "DKP Officer")) {
    msg.reply('Only DKP Officers can do this!');
    return;
  }
  const attachment = msg.attachments.first();
  if (!attachment) {
    msg.reply('Please attach a dump file');
    return;
  }
  const resp = await axios.get(attachment.url);
  const dump = resp.data;
  const roster = dump.split('\n').map((row) => {
    const cols = row.split('\t');
    return {
      grp: cols[0],
      characterName: cols[1],
      level: cols[2],
      className: cols[3]
    };
  });
  const now = new Date();
  const dayName = weekday[now.getDay()];
  let note = `${dayName} ${now.getHours() - 19}`;
  const customNote = msg.content.match(/note="([^]+)"/);
  if (customNote) {
    note = customNote[1];
  }
  let isAttendance = true;
  if(msg.content.match(/no\s?ra/i)) {
    isAttendance = false;
  }
  let raidId = msg.content.match(/raidId="([^]+)"/);
  if(raidId) {
    raidId = parseInt(raidId[1]);
  }
  let raid;
  if (raidId) {
    raid = await db.Raid.findOne({
      where: {
        id: raidId
      }
    });
  } else {
    raid = await db.Raid.create({
      note: note,
      isAttendance: isAttendance,
      when: now,
      value: 20
    });
  }

  for(const charData of roster) {
    if(charData.characterName) {
      const [usr, _] = await db.User.findOrCreate({
        where: {characterName: charData.characterName}
      });
      const values = {
        UserId: usr.id,
        RaidId: raid.id
      };
      await db.UserRaidAttendance.findOrCreate({
        where: values,
        defaults: values
      });
    }
  }
  await RecalculateCachedValues();
  msg.reply('Import Done');
  DiscordVoice.QueueFile(__dirname + '/../audio/register.wav');
};
messageHandlers.update_guild = async function(msg) {
  if(!msg.member.roles.cache.find(r => r.name === "DKP Officer")) {
    msg.reply('Only DKP Officers can do this!');
    return;
  }
  const attachment = msg.attachments.first();
  if (!attachment) {
    msg.reply('Please attach a guild dump file');
    return;
  }
  const resp = await axios.get(attachment.url);
  const dump = resp.data;
  const roster = dump.split('\n').map((row) => {
    return row.split('\t');
  });
  if (roster.length < 1 || roster[0].length !== 15) {
    msg.reply('Invalid guild dump format');
    return;
  }
  // ["Angry","60","Cleric","Raider","","10/09/19","The Temple of Veeshan","PE","","off","off","0","","PE","\r"]
  for(const char of roster) {
    if (char.length !== 15) { continue;}
    const defaults = {
      characterName: char[0],
      className: char[2],
      isMain: (char[4] !== 'A'),
      rank: char[3],
      spentPoints: 0,
      earnedPoints: 0,
      '30day': 0,
      '60day': 0,
      '90day': 0
    };
    const [usr, created] = await db.User.findOrCreate({
      where: {characterName: char[0]},
      defaults: defaults
    });
    if (!created) {
      usr.isMain = (char[4] !== 'A');
      usr.className = char[2];
      usr.rank = char[3];
      await usr.save();
    }
  }
  msg.reply('Roster updated!');
};

const assignHandlers = {};
assignHandlers.attendance = async function(msg) {
  if(!msg.member.roles.cache.find(r => r.name === "DKP Officer")) {
    msg.reply('Only DKP Officers can do this!');
    return;
  }
  let raidId = msg.content.match(/raidId="(\d+)"/);
  if (!raidId) {
    msg.reply('Please provide the item name by adding raidId="<the ID of the raid>"');;
    return;
  }
  raidId = raidId[1];

  let charId = msg.content.match(/charId="(\d+)"/);
  if (!charId) {
    msg.reply('Please provide the item name by adding charId="<the ID of character raid>"');;
    return;
  }
  charId = charId[1];
  const ura = await db.UserRaidAttendance.findOne({
    where: {
      RaidId: raidId,
      UserId: charId
    }
  });
  if (ura) {
    msg.reply("That character is already on the raid.");
    return;
  }
  await db.UserRaidAttendance.create({
    RaidId: raidId,
    UserId: charId
  });
  msg.reply(`Character ${charId} added to raid ${raidId}`);
  await RecalculateCachedValues();
};
assignHandlers.purchase = async function(msg) {
  if(!msg.member.roles.cache.find(r => r.name === "DKP Officer")) {
    msg.reply('Only DKP Officers can do this!');
    return;
  }
  let price = msg.content.match(/price="(\d+)"/);
  if (!price) {
    msg.reply('Please provide the item name by adding price="<the ID of the raid>"');;
    return;
  }
  price = price[1];

  let charId = msg.content.match(/charId="(\d+)"/);
  if (!charId) {
    msg.reply('Please provide the item name by adding charId="<the ID of character raid>"');;
    return;
  }
  charId = charId[1];

  let itemName = msg.content.match(/itemName="([^"]+)"/);
  if (!itemName) {
    msg.reply('Please provide the item name by adding itemName="<the ID of item in our database raid>"');;
    return;
  }
  itemName = itemName[1];
  const [item, _] = await db.Item.findOrCreate({
    where: {name: itemName},
  });
  const uip = await db.UserItemPurchase.findOne({
    where: {
      value: price,
      UserId: charId,
      ItemId: item.id
    }
  });
  if (uip) {
    msg.reply("That user has already purchased that item at that price.");
    return;
  }
  await db.UserItemPurchase.create({
    value: price,
    UserId: charId,
    ItemId: item.id
  });
  msg.reply(`Character ${charId} purchase for item "${itemName}" costing ${price} was added.`);
  await RecalculateCachedValues();
};
assignHandlers.ra = async function(msg) {
  if(!msg.member.roles.cache.find(r => r.name === "DKP Officer")) {
    msg.reply('Only DKP Officers can do this!');
    return;
  }
  let raidId = msg.content.match(/raidId="(\d+)"/);
  if (!raidId) {
    msg.reply('Please provide the item name by adding raidId="<the ID of the raid>"');;
    return;
  }
  raidId = raidId[1];

  const raid = await db.Raid.findOne({
    where: {
      id: raidId
    }
  });
  if (!raid) {
    msg.reply("Raid not found");
    return;
  }
  raid.isAttendance = true;
  await raid.save();

  msg.reply(`RA Added to Raid ID ${raidId}`);
  await RecalculateCachedValues();
};
messageHandlers.assign = async function(msg) {
  if(!msg.member.roles.cache.find(r => r.name === "DKP Officer")) {
    msg.reply('Only DKP Officers can do this!');
    return;
  }
  msg.content = msg.content.replace(/\s*assign\s*/i, '');
  let match = msg.content.match(/(\w+)(\s|$)/);
  if (!match) {
    const avaliableCommands = Object.keys(assignHandlers).map((k) => {
      return `* ${k}`;
    }).join('\n');
    msg.reply(`Please tell me what you would like to assign. Commands:\n${avaliableCommands}`);
    return;
  }
  const command = match[1];
  assignHandlers[command].call(null, msg);
};

const removeHandlers = {};
removeHandlers.attendance = async function(msg) {
  if(!msg.member.roles.cache.find(r => r.name === "DKP Officer")) {
    msg.reply('Only DKP Officers can do this!');
    return;
  }
  let raidId = msg.content.match(/raidId="(\d+)"/);
  if (!raidId) {
    msg.reply('Please provide the item name by adding raidId="<the ID of the raid>"');;
    return;
  }
  raidId = raidId[1];

  let charId = msg.content.match(/charId="(\d+)"/);
  if (!charId) {
    msg.reply('Please provide the item name by adding charId="<the ID of character raid>"');;
    return;
  }
  charId = charId[1];
  const ura = await db.UserRaidAttendance.findOne({
    where: {
      RaidId: raidId,
      UserId: charId
    }
  });
  if (!ura) {
    msg.reply("That character ID was not on that Raid");
    return;
  }
  await ura.destroy();
  msg.reply(`Character ${charId} removed from raid ${raidId}`);
  await RecalculateCachedValues();
};
removeHandlers.purchase = async function(msg) {
  if(!msg.member.roles.cache.find(r => r.name === "DKP Officer")) {
    msg.reply('Only DKP Officers can do this!');
    return;
  }
  let price = msg.content.match(/price="(\d+)"/);
  if (!price) {
    msg.reply('Please provide the item name by adding price="<the ID of the raid>"');;
    return;
  }
  price = price[1];

  let charId = msg.content.match(/charId="(\d+)"/);
  if (!charId) {
    msg.reply('Please provide the item name by adding charId="<the ID of character raid>"');;
    return;
  }
  charId = charId[1];

  let itemId = msg.content.match(/itemId="(\d+)"/);
  if (!itemId) {
    msg.reply('Please provide the item name by adding itemId="<the ID of item in our database raid>"');;
    return;
  }
  itemId = itemId[1];
  const uip = await db.UserItemPurchase.findOne({
    where: {
      value: price,
      UserId: charId,
      ItemId: itemId
    }
  });
  if (!uip) {
    msg.reply("That character ID did not have an item purchase for that price");
    return;
  }
  await uip.destroy();
  msg.reply(`Character ${charId} purchase for item ${itemId} costing ${price} was removed.`);
  await RecalculateCachedValues();
};
removeHandlers.ra = async function(msg) {
  if(!msg.member.roles.cache.find(r => r.name === "DKP Officer")) {
    msg.reply('Only DKP Officers can do this!');
    return;
  }
  let raidId = msg.content.match(/raidId="(\d+)"/);
  if (!raidId) {
    msg.reply('Please provide the item name by adding raidId="<the ID of the raid>"');;
    return;
  }
  raidId = raidId[1];

  const raid = await db.Raid.findOne({
    where: {
      id: raidId
    }
  });
  if (!raid) {
    msg.reply("Raid not found");
    return;
  }
  raid.isAttendance = false;
  await raid.save();

  msg.reply(`RA Added to Raid ID ${raidId}`);
  await RecalculateCachedValues();
};

removeHandlers.raid = async function(msg) {
  if(!msg.member.roles.cache.find(r => r.name === "DKP Officer")) {
    msg.reply('Only DKP Officers can do this!');
    return;
  }
  let raidId = msg.content.match(/raidId="(\d+)"/);
  if (!raidId) {
    msg.reply('Please provide the raidId by adding raidId="<the ID of the raid>"');;
    return;
  }
  raidId = raidId[1];

  const raid = await db.Raid.findOne({
    where: {
      id: raidId
    }
  });
  if (!raid) {
    msg.reply("That raid ID was not found");
    return;
  }
  await raid.destroy();
  await db.UserRaidAttendance.destroy({
    where: {
      RaidId: raidId
    }
  });
  msg.reply(`Raid ${raidId} removed.`);
  await RecalculateCachedValues();
};
messageHandlers.remove = async function(msg) {
  if(!msg.member.roles.cache.find(r => r.name === "DKP Officer")) {
    msg.reply('Only DKP Officers can do this!');
    return;
  }
  msg.content = msg.content.replace(/\s*remove\s*/i, '');
  let match = msg.content.match(/(\w+)(\s|$)/);
  if (!match) {
    const avaliableCommands = Object.keys(removeHandlers).map((k) => {
      return `* ${k}`;
    }).join('\n');
    msg.reply(`Please tell me what you would like to remove. Commands:\n${avaliableCommands}`);
    return;
  }
  const command = match[1];
  removeHandlers[command].call(null, msg);
};
messageHandlers.cancel = async function(msg) {
  if(!msg.member.roles.cache.find(r => r.name === "DKP Officer")) {
    msg.reply('Only DKP Officers can do this!');
    return;
  }
  msg.content = msg.content.replace(/\s*cancel\s*/i, '');
  msg.content = msg.content.replace(/\s*$/i, '');
  const itemName = msg.content.toLowerCase();
  if (!openBids[itemName]) {
    msg.reply(`No active auctions found for item "${itemName}"`);
    return;
  }
  for(const timer in openBids[itemName].timers) {
    try {
      clearTimeout(
        openBids[itemName].timers[timer]
      );
    } catch (err) {
      console.error('Error trying to clear timeout.', err);
    }
  }
  delete openBids[itemName];
  msg.reply(`I have canceled bidding for ${itemName}.`);
  tryTTS(`The auction for ${itemName} has been canceled.`);
};
messageHandlers.speak = async function(msg) {
  if(!msg.member.roles.cache.find(r => r.name === "DKP Officer")) {
    msg.reply('Only DKP Officers can do this!');
    return;
  }
  msg.content = msg.content.replace(/\s*speak\s*/i, '');
  msg.content = msg.content.replace(/\s*$/i, '');
  console.log("Saying: ", msg.content);

  tryTTS(msg.content);
};
function help(msg) {
  msg.reply(`Avaliable commands:

${discordBlockQuote}!dkp character <character name>${discordBlockQuote}
Returns the points and 30 day ra of the character.

${discordBlockQuote}!dkp bid item="< item name >" character="< character name >" bid="< bid value >"${discordBlockQuote}
Places a bid for the item/char/value.  This can be sent in a message directly to the bot.  Your discord name will be shown to the public if you win.
`);
  msg.reply(`
"DKP Officer" Commands:
${discordBlockQuote}!dkp import note="< note for raid >"${discordBlockQuote}
Attach a EQ dump with this message and it will create a 20 point raid.  If it is a non RA raid add "noRA". If you want to append to a raid use raidId="123"

${discordBlockQuote}!dkp update_guild${discordBlockQuote}
Attach an EQ Guild dump and it will update member's ranks/levels.

${discordBlockQuote}!dkp auction item="Blade of Carnage" qty="1"${discordBlockQuote}
Starts a 3 min auction for Blade of Carnage. qty is optional.  If it is greater than 1 multiple winners will be chosen.

${discordBlockQuote}!dkp cancel Blade of Carnage${discordBlockQuote}
Cancels bidding for "Blade of Carnage"

${discordBlockQuote}!dkp remove${discordBlockQuote}
The base command used to remove things:

${discordBlockQuote}!dkp remove attendance raidId="1" charId="145"${discordBlockQuote}
Removes the character id from the specified raid id.  Use the website to find these values.

${discordBlockQuote}!dkp remove purchase price="10" charId="145" itemId="92"${discordBlockQuote}
Removes the character id from the specified raid id.  Use the website to find these values.

${discordBlockQuote}!dkp assign${discordBlockQuote}
The base command used to assign things:

${discordBlockQuote}!dkp assign attendance raidId="1" charId="145""${discordBlockQuote}
Assigns character id 145 to raid id 1.

${discordBlockQuote}!dkp assign purchase price="9001" charId="145" itemName="The Cake"${discordBlockQuote}
Assigns the item named "The Cake" to character id 145 for 9001 points.

Sub commands:
${discordBlockQuote}!character help${discordBlockQuote}
Shows the help page for character commands.

${discordBlockQuote}!dkp_voice help${discordBlockQuote}
Shows the help page for dkp_voice commands.
`);
};
messageHandlers.help = help;
messageHandlers.h = help;
messageHandlers.commands = help;

const routes = {
  dkp: messageHandlers,
  articles: Articles,
  character: require('./character'),
  dkp_voice:  require('./dkp_voice')
};
const routePrefixMatchers = Object.keys(routes).map((r) => {
  return {
    command: r,
    regex: new RegExp(`^!${r.toLowerCase()}\\b`, 'i')
  };
});
console.log(routePrefixMatchers);
client.on('message', async (msg) => {
  if(msg.author.bot) return;
  for (const commandPrefix of routePrefixMatchers) {
    if (msg.content.match(commandPrefix.regex)) {
      console.log('match: ', commandPrefix);
      msg.content = msg.content.replace(commandPrefix.regex, '');
      msg.content = msg.content.trim();
      let command = msg.content.match(/^([^\s]+)/i);
      if (!command) {
        msg.reply("Please specify a sub-command.");
        return;
      }
      command = command[1];
      if (command) { command = command.toLowerCase();}
      msg.content = msg.content.replace(/^([^\s]+)\s+/i, '');
      if (routes[commandPrefix.command][command]) {
        try {
          await routes[commandPrefix.command][command].call(null, msg);
        } catch (err) {
          if(err.discordReply) {
            msg.reply(err.discordReply);
            return;
          }
          console.error(err);
        }
      }
      break;
    }
    
  }
  
});

client.login(process.env.DISCORD_TOKEN);
httpServer.on('message', (msg) => {
  switch(msg.cmd) {
    case 'Auction':
      startAuction(
        msg.args.item,
        parseInt(msg.args.qty,10),
        {
          channel: client.channels.cache.get(process.env.DKP_BID_CHAN) // "dkp" channel
        } // Spoofed Discord message
      );
      break;
  }
});
console.log("Starting Bossman.");
