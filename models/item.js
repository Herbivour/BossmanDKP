module.exports = ( sequelize, DataTypes ) => {
  const Item = sequelize.define( "Item", {
    "name": DataTypes.STRING,
    "itemId": DataTypes.INTEGER
  }, {} );

  Item.associate = function( models ) {
    // associations can be defined here
    Item.hasMany( models.UserItemPurchase, { "foreignKey": "ItemId", "as": "purchases" } );
    Item.belongsToMany( models.User, { "through": "UserItemPurchase" } );
    Item.belongsToMany( models.Raid, { "through": "UserItemPurchase" } );
  };
  return Item;
};
