const eqClasses = require('../classes.json');
const db = require('../models');
const Op = db.Sequelize.Op;
const bq = "```";
const handlers = {};

function help(msg) {
  msg.reply(`!character commands:\n
${bq}!character info Herbivour Zerotul Namien${bq}
Shows points and RA for Herbivour, Zerotul, and Namien.

${bq}!character list priests${bq}
Shows the top 15 non box priests (ordered by DKP then RA). use !character list help to see all avaliable options.

DKP Admin commands:
${bq}!character main_change Herbivour => Zerotul${bq}
Does a main chaing to Zerotul from Herbivour. CAUTION: This deletes Zerotul's history!

${bq}!character set class Herbivour Cleric${bq}
Set's the class of Herbivour to cleric

${bq}!character set rank Zerotul Hidden${bq}
Set's the rank of Zerotul to Hidden
`);
}

const mainChangeCopyFields = [
  'spentPoints',
  'earnedPoints',
  '30day',
  '60day',
  '90day',
  'currentPoints',
  'wastedPoints'
];
async function main_change(msg) {
  if(!msg.member.roles.cache.find(r => r.name === "DKP Officer")) {
    msg.reply('Only DKP Officers can do this!');
    return;
  }
  const tokens = msg.content.split(/\s+/);
  if (tokens.length !== 3 || tokens[1] !== '=>') {
    const errMsg = 'Invalid !character main_change format.  Please read !character help for an example';
    const err = new Error(errMsg);
    err.discordReply = errMsg;
    throw err;
  }

  const sourceCharacterName = tokens[0].toLowerCase();
  const destinationCharacterName = tokens[2].toLowerCase();

  if(sourceCharacterName === destinationCharacterName) {
    const errMsg = 'Can not main_change to the same character';
    const err = new Error(errMsg);
    err.discordReply = errMsg;
    throw err;
  }

  const sourceCharacter = await db.User.findOne({
    where: {
      characterName: sourceCharacterName
    }
  });

  if (!sourceCharacter) {
    const errMsg = 'Can not find source character.';
    const err = new Error(errMsg);
    err.discordReply = errMsg;
    throw err;
  }

  const destinationCharacter = await db.User.findOne({
    where: {
      characterName: destinationCharacterName
    }
  });

  if (!destinationCharacter) {
    const errMsg = 'Can not find destination character.';
    const err = new Error(errMsg);
    err.discordReply = errMsg;
    throw err;
  }

  // If we are sending the unit testing flag 
  //   we don't want the end of the function to run.
  if (msg.unitTesting) { return;}

  // destroy history for destination character
  await db.UserRaidAttendance.destroy(
    { where: { UserId: destinationCharacter.id } }
  );
  await db.UserItemPurchase.destroy(
    { where: { UserId: destinationCharacter.id } }
  );

  await db.UserRaidAttendance.update(
    {UserId: destinationCharacter.id},
    { where: { UserId: sourceCharacter.id } }
  );
  await db.UserItemPurchase.update(
    {UserId: destinationCharacter.id},
    { where: { UserId: sourceCharacter.id } }
  );

  for(const attrName of mainChangeCopyFields) {
    destinationCharacter[attrName] = sourceCharacter[attrName];
    sourceCharacter[attrName] = 0;
  }
  await destinationCharacter.save();
  await sourceCharacter.save();
  msg.reply(`Main change complete ${sourceCharacter.characterName} => ${destinationCharacter.characterName}`);
}
async function set(msg) {
  if(!msg.member.roles.cache.find(r => r.name === "DKP Officer")) {
    msg.reply('Only DKP Officers can do this!');
    return;
  }
  const tokens = msg.content.split(/\s+/);
  console.log(tokens);
  if (tokens.length !== 3) {
    const errMsg = 'Invalid !character set format.  Please read !character help for an example';
    const err = new Error(errMsg);
    err.discordReply = errMsg;
    throw err;
  }
  const name = tokens[1];
  const user = await db.User.findOne({ where: {characterName: name}});
  if (!user) {
    msg.reply(`Character ${name} not found.`);
    return;
  }
  switch(tokens[0]) {
  case 'class':
    const className = tokens[2];
    if (eqClasses.indexOf(className) === -1) {
      msg.reply(`Class ${className} is not a valid EQ class, please select from:\n${eqClasses.join(', ')}`);
      return;
    }
    user.className = className;
    await user.save();
    msg.reply(`Character ${user.characterName} updated to class ${user.className}`);
    break;
  case 'rank':
    const rankName = tokens[2];
    if (!rankName) {
      msg.reply('Please provide a rank name');
      return;
    }
    user.rank = rankName;
    await user.save();
    msg.reply(`Character ${user.characterName} updated to rank ${user.rank}`);
    break;
  default:
    msg.reply(`Unkown command ${tokens[0]} for !character set`);
    return;
  }
}
async function info(msg) {
  const tokens = msg.content.split(/\s+/);
  if (tokens.length > 10) {
    const errMsg = 'You can only ask about a max of 10 characters at a time';
    const err = new Error(errMsg);
    err.discordReply = errMsg;
    throw err;
  }
  const characters = await db.User.findAll({
    where: {
      characterName: {
        [Op.in]: tokens
      }
    },
    order: [
      ['30day', 'DESC'],
      ['60day', 'DESC'],
      ['90day', 'DESC']
    ]
  });
  let response = `${bq}ini\n`;
  for(const char of characters) {
    response += `* ${char.characterName} - ${char.currentPoints} RA 30: ${char['30day']}%, 60: ${char['60day']}%, 90: ${char['90day']}%,\n`;
  }
  response += bq;
  msg.reply(response);
}
const listQueryArgs = {
  priest: {
    className: {
      [Op.in]: [
        'Cleric',
        'Druid',
        'Shaman'
      ]
    }
  },
  caster: {
    className: {
      [Op.in]: [
        'Enchanter',
        'Magician',
        'Necromancer',
        'Wizard'
      ]
    }
  },
  mana: {
    className: {
      [Op.in]: [
        'Bard',
        'Beastlord',
        'Cleric',
        'Druid',
        'Shaman',
        'Enchanter',
        'Magician',
        'Necromancer',
        'Wizard'
      ]
    }
  },
  tank: {
    className: {
      [Op.in]: [
        'Paladin',
        'Shadow Knight',
        'Warrior'
      ]
    }
  },
  melee: {
    className: {
      [Op.in]: [
        'Monk',
        'Ranger',
        'Rogue',
        'Beastlord',
        'Berserker'
      ]
    }
  },
  plate: {
    className: {
      [Op.in]: [
        'Bard',
        'Cleric',
        'Paladin',
        'Shadow Knight',
        'Warrior'
      ]
    }
  },
  chain: {
    className: {
      [Op.in]: [
        'Ranger',
        'Rogue',
        'Shaman',
        'Berserker'
      ]
    }
  },
  leather: {
    className: {
      [Op.in]: [
        'Druid',
        'Monk',
        'Beastlord'
      ]
    }
  }
};
listQueryArgs.priests = listQueryArgs.priest;
listQueryArgs.casters = listQueryArgs.caster;
listQueryArgs.cloth = listQueryArgs.caster;
for(const cls of eqClasses) {
  const lCls = cls.toLowerCase();
  listQueryArgs[lCls] = {
    className: cls
  };
}
async function list(msg) {
  const tokens = msg.content.toLowerCase().split(/\s+/);
  if (tokens[0] === 'help') {
    let reply = `!character list options:\n${bq}`;
    for (const helper in listQueryArgs) {
      reply += `* ${helper} - `;
      if (typeof(listQueryArgs[helper].className) === 'string') {
        reply += listQueryArgs[helper].className;
        reply += '\n';
      } else if (Array.isArray(listQueryArgs[helper].className[Op.in])) {
        reply += listQueryArgs[helper].className[Op.in].join(', ');
        reply += '\n';
      }
    }
    reply += bq;
    msg.reply(reply);
    return;
  }
  if (tokens[0] === 'shadow' && tokens[1] === 'knight') {
    tokens[0] += ` ${tokens[1]}`;
  }
  if (!listQueryArgs[tokens[0]]) {
    const errMsg = 'Unknown list option';
    const err = new Error(errMsg);
    err.discordReply = errMsg;
    throw err;
  }
  const where = listQueryArgs[tokens[0]];
  where.rank = {
    [Op.notIn]: ["Box/Alt", "Raid Box", "FNF"],
  };
  where.currentPoints = {
    [Op.gt]: 0
  },
  where['60day'] = {
    [Op.gt]: 0
  };
  const characters = await db.User.findAll({
    where: where,
    limit: 15,
    order: [
      ['currentPoints', 'DESC'],
      ['30day', 'DESC'],
      ['60day', 'DESC'],
      ['90day', 'DESC']
    ]
  });
  let response = `${bq}ini\n`;
  for(const char of characters) {
    response += `* [${char.characterName}] (${char.className}) - [${char.currentPoints}] RA 30: [${char['30day']}%], 60: ${char['60day']}%, 90: ${char['90day']}%, ID: ${char.id}\n`;
  }
  response += bq;
  msg.reply(response);
}

handlers.help = help;
handlers.main_change = main_change;
handlers.set = set;
handlers.info = info;
handlers.list = list;
module.exports = handlers;