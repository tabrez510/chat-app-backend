const Sequelize = require('sequelize');
const sequelize = require('../utils/database');

const UserGroup = sequelize.define('usergroup', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  isAdmin: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
});

module.exports = UserGroup;
