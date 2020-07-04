module.exports = ( sequelize, DataTypes ) => {
  const UserItemPurchase = sequelize.define( "UserItemPurchase", {
    "ItemId": DataTypes.INTEGER,
    "UserId": DataTypes.INTEGER,
    "RaidId": DataTypes.INTEGER,
    "value": DataTypes.INTEGER
  }, {
    indexes: [
      {
        unique: false,
        fields: ['RaidId', 'UserId']
      },
      {
        unique: false,
        fields: ['UserId', 'RaidId']
      },
      {
        unique: false,
        fields: ['UserId', 'ItemId']
      }
    ]
  } );

  UserItemPurchase.associate = function( models ) {
    // associations can be defined here
    UserItemPurchase.belongsTo(models.User, {foreignKey: 'UserId'});
    UserItemPurchase.belongsTo( models.Item, { "foreignKey": "ItemId", "as": "item" } );
    // UserItemPurchase.belongsTo(models.Raid, {foreignKey: 'RaidId', as: 'raid'});
  };
  return UserItemPurchase;
};
