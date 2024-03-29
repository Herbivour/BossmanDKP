module.exports = {
  "up": ( queryInterface, Sequelize ) => {
    return queryInterface.createTable( "Items", {
      "id": {
        "allowNull": false,
        "autoIncrement": true,
        "primaryKey": true,
        "type": Sequelize.INTEGER
      },
      "name": {
        "type": Sequelize.STRING
      },
      "itemId": {
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
    return queryInterface.dropTable( "Items" );
  }
};
