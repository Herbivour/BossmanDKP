module.exports = ( sequelize, DataTypes ) => {
  const UserRaidAttendance = sequelize.define( "UserRaidAttendance", {
    "UserId": DataTypes.INTEGER,
    "RaidId": DataTypes.INTEGER
  }, {
    indexes: [
      {
        unique: false,
        fields: ['RaidId', 'UserId']
      }
    ]
  } );

  UserRaidAttendance.associate = function( models ) {
    // associations can be defined here
  };
  return UserRaidAttendance;
};
