// // sockets/socket.js
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Group = require('../models/group');
const UserGroup = require('../models/usergroup');

module.exports = (io) => {
    io.on('connection', async(socket) => {
        console.log('User connected: ', socket.id);
        const token = socket.handshake.query.token;
        // first update socket id in user table and join all the available rooms
        try {
            const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
            
            const userId = decoded.userId;

            const user = await User.findByPk(userId);
            if (user) {
                user.socketId = socket.id;
                await user.save();
                console.log(`Socket ID updated for user ${userId}: ${socket.id}`);

                // find all the groups of user and join him in that room
                const userGroups = await UserGroup.findAll({
                    where: {
                        userId
                    },
                    include: [{ model: Group }],
                    order: [[Group, 'lastActivity', 'DESC']],
                });

                userGroups.forEach((userGroup) => socket.join(userGroup.groupId));
            } else {
                console.log(`User with ID ${userId} not found.`);
            }
        } catch (error) {
            console.error('Authentication error:', error);
        }

        socket.on('disconnect', () => {
            console.log('User disconnected: ', socket.id);
        });
    });
}

