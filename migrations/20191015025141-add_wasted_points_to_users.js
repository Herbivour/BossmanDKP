'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'Users',
      'wastedPoints',
      Sequelize.FLOAT
    );

  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Users', 'wastedPoints');
  }
};
