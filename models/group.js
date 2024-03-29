const Sequelize = require('sequelize');
const sequelize = require('../utils/database');

const Group = sequelize.define('group', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  lastActivity: {
    type: Sequelize.DATE,
    allowNull: false
  }
});

module.exports = Group;
