const Sequelize = require('sequelize');
const sequelize = require('../utils/database');

const Chat = sequelize.define('chat', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    message: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    multimedia: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

module.exports = Chat;