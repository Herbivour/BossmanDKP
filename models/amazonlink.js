'use strict';
module.exports = (sequelize, DataTypes) => {
  const AmazonLink = sequelize.define('AmazonLink', {
    url: DataTypes.STRING,
    title: DataTypes.STRING,
    rank: DataTypes.INTEGER,
    html: DataTypes.TEXT,
  }, {});
  AmazonLink.associate = function(models) {
    // associations can be defined here
  };
  return AmazonLink;
};