const Sequelize = require('sequelize');
module.exports = ( sequelize, DataTypes ) => {
  const Op = Sequelize.Op;
  const User = sequelize.define( "User", {
    "characterName": DataTypes.STRING,
    "className": DataTypes.STRING,
    "isMain": DataTypes.BOOLEAN,
    "rank": DataTypes.STRING,
    "bonusPct": DataTypes.INTEGER,
    "spentPoints": DataTypes.FLOAT,
    "earnedPoints": DataTypes.FLOAT,
    "lifetime": DataTypes.FLOAT,
    "30day": DataTypes.FLOAT,
    "60day": DataTypes.FLOAT,
    "90day": DataTypes.FLOAT,
    "currentPoints": DataTypes.FLOAT,
    "wastedPoints": DataTypes.FLOAT
  }, {} );

  User.associate = function( models ) {
    // associations can be defined here
    User.hasMany( models.UserRaidAttendance, { "foreignKey": "UserId", "as": "raid_attendances" } );
    User.belongsToMany( models.Raid, { "through": "UserRaidAttendance" } );
    User.hasMany( models.UserItemPurchase, { "foreignKey": "UserId", "as": "purchases" } );
    User.belongsToMany( models.Item, { "through": "UserItemPurchase" } );
  };

  User.updateRaidAttendanceAll = async function(db) {
    const _30DaysAgo = new Date();
    _30DaysAgo.setDate(_30DaysAgo.getDate() - 30);
    let _60DaysAgo = new Date();
    _60DaysAgo.setDate(_60DaysAgo.getDate() - 60);
    let _90DaysAgo = new Date();
    _90DaysAgo.setDate(_90DaysAgo.getDate() - 90);

    const raidCnt = {
      '30day': await db.Raid.count({
        where: {
          isAttendance: true,
          when: {
            [Op.gte]: _30DaysAgo
          }
        }
      }),
      '60day': await db.Raid.count({
        where: {
          isAttendance: true,
          when: {
            [Op.gte]: _60DaysAgo
          }
        }
      }),
      '90day': await db.Raid.count({
        where: {
          isAttendance: true,
          when: {
            [Op.gte]: _90DaysAgo
          }
        }
      })
    };
    console.log(raidCnt);
    await db.sequelize.query(
      "UPDATE Users Set `30day` = 100.0 * (Select count(*) from UserRaidAttendances Join Raids on UserRaidAttendances.RaidId = Raids.id where UserId = Users.id and `when` >= ? and Raids.isAttendance = true) / ?, `60day` = 100.0 * (Select count(*) from UserRaidAttendances Join Raids on UserRaidAttendances.RaidId = Raids.id where UserId = Users.id and `when` >= ? and Raids.isAttendance = true) / ?, `90day` = 100.0 * (Select count(*) from UserRaidAttendances Join Raids on UserRaidAttendances.RaidId = Raids.id where UserId = Users.id and `when` >= ? and Raids.isAttendance = true) / ?;",
      { replacements: [_30DaysAgo, raidCnt['30day'], _60DaysAgo, raidCnt['60day'], _90DaysAgo, raidCnt['90day']], type: sequelize.QueryTypes.UPDATE }
    );
  };
  return User;
};
