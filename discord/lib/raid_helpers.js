const db = require('../../models');

async function RecalculateCachedValues() {
  await db.sequelize.query("Update Users Set spentPoints = (Select sum(UserItemPurchases.value) from UserItemPurchases where UserItemPurchases.UserId = Users.id group by UserItemPurchases.UserId );");
  await db.sequelize.query("Update Users Set earnedPoints = (Select sum(Raids.value) from Raids Join UserRaidAttendances on Raids.id = UserRaidAttendances.RaidId where UserRaidAttendances.UserId = Users.id group by UserRaidAttendances.UserId);");
  db.User.updateRaidAttendanceAll(db);
  await db.sequelize.query("Update Users Set earnedPoints = (Select sum(Raids.value) from Raids Join UserRaidAttendances on Raids.id = UserRaidAttendances.RaidId where UserRaidAttendances.UserId = Users.id group by UserRaidAttendances.UserId);");
  await db.sequelize.query("Update Users Set currentPoints = IFNULL(earnedPoints, 0) - IFNULL(spentPoints, 0) - IFNULL(wastedPoints, 0);");
  await db.sequelize.query("Update Users Set wastedPoints = IFNULL(wastedPoints, 0) + (currentPoints - 2000) where currentPoints is not null and currentPoints > 2000;");
  // Run this a second time to update for people who were over cap.
  await db.sequelize.query("Update Users Set currentPoints = IFNULL(earnedPoints, 0) - IFNULL(spentPoints, 0) - IFNULL(wastedPoints, 0);");
}

module.exports.RecalculateCachedValues = RecalculateCachedValues;