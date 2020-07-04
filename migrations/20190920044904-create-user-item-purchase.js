module.exports = {
  "up": ( queryInterface, Sequelize ) => {
    return queryInterface.createTable( "UserItemPurchases", {
      "id": {
        "allowNull": false,
        "autoIncrement": true,
        "primaryKey": true,
        "type": Sequelize.INTEGER
      },
      "ItemId": {
        "type": Sequelize.INTEGER
      },
      "UserId": {
        "type": Sequelize.INTEGER
      },
      "RaidId": {
        "type": Sequelize.INTEGER
      },
      "value": {
        "type": Sequelize.INTEGER
      },
      "createdAt": {
        "allowNull": false,
        "type": Sequelize.DATE
      },
      "updatedAt": {
        "allowNull": false,
        "type": Sequelize.DATE
      }
    } );
  },
  "down": ( queryInterface, Sequelize ) => {
    return queryInterface.dropTable( "UserItemPurchases" );
  }
};
