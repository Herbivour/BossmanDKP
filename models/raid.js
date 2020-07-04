module.exports = ( sequelize, DataTypes ) => {
  const Raid = sequelize.define( "Raid", {
    "note": DataTypes.STRING,
    "isAttendance": DataTypes.BOOLEAN,
    "when": DataTypes.DATE,
    "value": DataTypes.INTEGER
  }, {
    indexes: [
      {
        unique: false,
        fields: ['when']
      }
    ]
  } );

  Raid.associate = function( models ) {
    // associations can be defined here
    Raid.hasMany( models.UserRaidAttendance, { "foreignKey": "RaidId", "as": "raid_attendances" } );
    Raid.hasMany( models.UserItemPurchase, { "foreignKey": "RaidId", "as": "purchases" } );
    Raid.belongsToMany( models.Item, { "through": "UserItemPurchase" } );
    Raid.belongsToMany( models.User, { "through": "UserRaidAttendance" } );
  };
  return Raid;
};
