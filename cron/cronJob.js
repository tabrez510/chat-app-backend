const cron = require('node-cron');
const Sequelize = require('sequelize');
const Chat = require('../models/chat');
const ArchivedChat = require('../models/archivedchat');
const sequelize = require('../utils/database');

// Function to move old messages to ArchivedChat table and delete them from Chat table
async function moveAndDeleteOldMessages() {
    const t = await sequelize.transaction();
    try {
        // Find all messages older than 24 hours
        const oldMessages = await Chat.findAll({
            where: {
                createdAt: {
                    [Sequelize.Op.gt]: new Date(new Date() - 24 * 60 * 60 * 1000)
                }
            },
            transaction : t
        });

        // Move old messages to ArchivedChat table
        await ArchivedChat.bulkCreate(oldMessages.map(message => ({
            id: message.id,
            message: message.message,
            multimedia: message.multimedia,
            name: message.name,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
            userId: message.userId,
            groupId: message.groupId
        })), { transaction : t });

        // Delete old messages from Chat table
        await Chat.destroy({
            where: {
                createdAt: {
                    [Sequelize.Op.gt]: new Date(new Date() - 24 * 60 * 60 * 1000)
                }
            },
            transaction : t 
        });

        
        await t.commit();
        console.log('Old messages moved and deleted successfully.');
    } catch (error) {
        
        await t.rollback();
        console.error('Error moving and deleting messages:', error);
    }
}

// Start the cron job
function start() {
    // Schedule the cron job to run every night at 12:00 AM
    cron.schedule('0 0 * * *', () => {
        console.log('Running cron job...');
        moveAndDeleteOldMessages();
    });
}

module.exports = { start };
