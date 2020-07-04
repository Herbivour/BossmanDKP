// Migrates from an EQ DKP database.
// Best effort
const db = require('../models');
const axios = require('axios');
const instance = axios.create({
  baseURL: process.env.EQDKP_API_URL,
  headers: {'API-Token': process.env.EQDKP_API_TOKEN}
});
const chars = {};
const raids = {};
async function go() {
  const raids = await instance.get('?function=raids&format=json');
  const points = await instance.get('?function=points&format=json&memberdata=items,adjustments');
  console.log(Object.keys(raids.data));
  console.log(Object.keys(points.data.players));
  for (const playerId in points.data.players) {
    const id = playerId.split(':')[1];
    const player = points.data.players[playerId];
    chars[id] = {
      id: id,
      characterName: player.name,
      className: player.class_name,
      isMain: player.id === parseInt(player.main_id, 10),
      rank: 'member'
    };
    const [usr, _] = await db.User.findOrCreate({
      where: {characterName: player.name},
      defaults: chars[id]
    });
    for(const itemId in player.items) {
      const pItem = player.items[itemId];
      console.log();
      console.log(pItem);
      const [item, _] = await db.Item.findOrCreate({
        where: {name: pItem.name},
      });
            
      console.log(JSON.stringify(item));
      console.log(item.id);
      const uipValues = {
        ItemId: item.id,
        UserId: usr.id,
        value: parseInt(player.items[itemId].value, 10)
      };
      await db.UserItemPurchase.findOrCreate({
        where: uipValues,
        defaults: uipValues
      });
    }
  }
  console.log('\n\n\nRAIDS\n\n\n');
  for (const raidId in raids.data) {
    if(!raidId.startsWith('raid')) {
      continue;
    }
    const id = raidId.split(':')[1];
    const raid = raids.data[raidId];
    let isAttendance = Boolean(raid.event_name.match(/RA & DKP/i));
    if (!isAttendance) {
      isAttendance = Boolean(raid.event_name.match(/Attendance/));
    }
    raids[id] = {
      id: id,
      note: raid.note,
      isAttendance: isAttendance,
      when: new Date(parseInt(raid.date_timestamp, 10) * 1000),
      value: parseFloat(raid.value, 10)
    };
    await db.Raid.findOrCreate({
      where: raids[id],
      defaults: raids[id]
    });
    for(const userId of raid.raid_attendees) {
      const values = {
        UserId: parseInt(userId, 10),
        RaidId: parseInt(raid.id)
      };
      console.log(values);
      await db.UserRaidAttendance.findOrCreate({
        where: values,
        defaults: values
      });
    }
  }
  // Do this programatically to be mysql friendly.

  await db.sequelize.query("Update Users Set spentPoints = (Select sum(UserItemPurchases.value) from UserItemPurchases where UserItemPurchases.UserId = Users.id group by UserItemPurchases.UserId );");
  await db.sequelize.query("Update Users Set earnedPoints = (Select sum(Raids.value) from Raids Join UserRaidAttendances on Raids.id = UserRaidAttendances.RaidId where UserRaidAttendances.UserId = Users.id group by UserRaidAttendances.UserId);");
  await db.sequelize.query("UPDATE Users Set lifetime = (100.0 * (Select count(*) from UserRaidAttendances Join Raids on UserRaidAttendances.RaidId = Raids.id where UserId = Users.id and Raids.isAttendance = true) / (Select count(*) from Raids where Raids.isAttendance = true)), `30day` = 100.0 * (Select count(*) from UserRaidAttendances Join Raids on UserRaidAttendances.RaidId = Raids.id where UserId = Users.id and `when` BETWEEN DATE_SUB(NOW(), INTERVAL 30 DAY) AND NOW() and Raids.isAttendance = true) / (Select count(*) from Raids where `when` BETWEEN DATE_SUB(NOW(), INTERVAL 30 DAY) AND NOW() and Raids.isAttendance = true), `60day` = 100.0 * (Select count(*) from UserRaidAttendances Join Raids on UserRaidAttendances.RaidId = Raids.id where UserId = Users.id and `when` BETWEEN DATE_SUB(NOW(), INTERVAL 60 DAY) AND NOW() and Raids.isAttendance = true) / (Select count(*) from Raids where `when` BETWEEN DATE_SUB(NOW(), INTERVAL 60 DAY) AND NOW() and Raids.isAttendance = true), `90day` = 100.0 * (Select count(*) from UserRaidAttendances Join Raids on UserRaidAttendances.RaidId = Raids.id where UserId = Users.id and `when` BETWEEN DATE_SUB(NOW(), INTERVAL 90 DAY) AND NOW() and Raids.isAttendance = true) / (Select count(*) from Raids where `when` BETWEEN DATE_SUB(NOW(), INTERVAL 90 DAY) AND NOW() and Raids.isAttendance = true);");
  await db.sequelize.query("UPDATE Users Set currentPoints = IFNULL(earnedPoints, 0) - IFNULL(spentPoints, 0);");
}
go().catch(console.error);