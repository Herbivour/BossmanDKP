module.exports = {
  "up": ( queryInterface, Sequelize ) => {
    return queryInterface.createTable( "Users", {
      "id": {
        "allowNull": false,
        "autoIncrement": true,
        "primaryKey": true,
        "type": Sequelize.INTEGER
      },
      "characterName": {
        "allowNull": false,
        "type": Sequelize.STRING
      },
      "className": {
        "type": Sequelize.STRING
      },
      "isMain": {
        "type": Sequelize.BOOLEAN
      },
      "rank": {
        "type": Sequelize.STRING
      },
      "bonusPct": {
        "type": Sequelize.INTEGER
      },
      "spentPoints": {
        "type": Sequelize.FLOAT
      },
      "earnedPoints": {
        "type": Sequelize.FLOAT
      },
      "lifetime": {
        "type": Sequelize.FLOAT
      },
      "30day": {
        "type": Sequelize.FLOAT
      },
      "60day": {
        "type": Sequelize.FLOAT
      },
      "90day": {
        "type": Sequelize.FLOAT
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
    return queryInterface.dropTable( "Users" );
  }
};
