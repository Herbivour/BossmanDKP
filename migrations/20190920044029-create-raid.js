module.exports = {
  "up": ( queryInterface, Sequelize ) => {
    return queryInterface.createTable( "Raids", {
      "id": {
        "allowNull": false,
        "autoIncrement": true,
        "primaryKey": true,
        "type": Sequelize.INTEGER
      },
      "note": {
        "type": Sequelize.STRING
      },
      "isAttendance": {
        "type": Sequelize.BOOLEAN
      },
      "when": {
        "type": Sequelize.DATE
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
    return queryInterface.dropTable( "Raids" );
  }
};
