const Group = require('../models/group');
const UserGroup = require('../models/usergroup');
const User = require('../models/user');
const sequelize = require('sequelize');


const updateGroupActivity = async (groupId) => {
    const group = await Group.findByPk(groupId);
    if (group) {
        group.lastActivity = new Date(); 
        await group.save();
    }
};

async function adminChecker(userId, groupId){
    try {
        const user = await UserGroup.findOne({
            where: {
                userId,
                groupId
            }
        });
        return user.isAdmin;
    } catch(err) {
        console.log(err);
    }
}

exports.createGroup = async (req, res) => {
    try {
        const {name} = req.body;
        const userId = req.user.id;
        const group = await Group.create({name, lastActivity: new Date()});
        await UserGroup.create({isAdmin: true, userId, groupId: group.id});
        const io = req.app.get('io');
        res.json({success: true, message: "Group created successfully", ...group.dataValues});
    } catch(err) {
        console.log(err);
        res.status(500).json({success: false, message: "Internal Server Error"});
    }
}

exports.getGroups = async (req, res) => {
    try {
        const userId = req.user.id;
        const userGroups = await UserGroup.findAll({
            where: {
                userId
            },
            include: [{ model: Group }],
            order: [[Group, 'lastActivity', 'DESC']],
        });

        const groups = userGroups.map((userGroup) => userGroup.group);

        res.json(groups.map((group) => group.dataValues));

    } catch (err) {
        console.log(err);
        res.status(500).json({success: false, message: "Internal Server Error"});
    }
}

exports.addUserToGroup = async (req, res) => {
    try {
        const { userId, groupId } = req.body;
        const isAdmin = await adminChecker(req.user.id, groupId);
        if(isAdmin){
            await UserGroup.create({isAdmin: false, userId, groupId});
            const io = req.app.get('io');
            await updateGroupActivity(groupId);
            const user = await User.findOne({
                where: {
                    id: userId
                }
            })
            io.to(user.socketId).emit('userAddedToGroup');
            res.json({success: true, message: "User added successfully"});
        } else {
            res.json({success: false, message: "You are not an admin"})
        }
    }catch(err) {
        console.log(err);
        res.status(500).json({success: false, message: "Internal Server Error"});
    }
}

exports.removeUserFromGroup = async (req, res) => {
    try {
        const { userId, groupId } = req.body;
        const isAdmin = await adminChecker(req.user.id, groupId);
        if(isAdmin){
            await UserGroup.destroy({
                where : {
                    userId,
                    groupId
                }
            })
            await updateGroupActivity(groupId);
            const user = await User.findOne({
                where: {
                    id: userId
                }
            })
            const io = req.app.get('io');
            io.to(user.socketId).emit('userRemovedFromGroup', {groupId});
            res.json({success: false, message: "User removed from group successfully"});
        } else {
            res.json({success: false, message: "You are not an admin"})
        }
    } catch(err) {
        console.log(err);
        res.status(500).json({success: false, message: "Internal Server Error"});
    }
}

exports.makeAdmin = async (req, res) => {
    try {
        const { userId, groupId } = req.body;
        const isAdmin = await adminChecker(req.user.id, groupId);
        if(isAdmin){
            await UserGroup.update({ isAdmin: true }, { where: { userId, groupId } });
            await updateGroupActivity(groupId);
            const user = await User.findOne({
                where: {
                    id: userId
                }
            })
            const io = req.app.get('io');
            io.to(user.socketId).emit('adminMade', groupId);
            res.json({ success: true, message: 'User made admin successfully' });
        } else {
            res.json({success: false, message: "You are not an admin"})
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.removeAdmin = async (req, res) => {
    try {
        const { userId, groupId } = req.body;
        const isAdmin = await adminChecker(req.user.id, groupId);
        if(isAdmin){
            await UserGroup.update({ isAdmin: false }, { where: { userId, groupId } });
            await updateGroupActivity(groupId);
            const user = await User.findOne({
                where: {
                    id: userId
                }
            })
            const io = req.app.get('io');
            io.to(user.socketId).emit('adminRemoved', groupId);
            res.json({ success: true, message: 'User made admin successfully' });
        } else {
            res.json({success: false, message: "You are not an admin"})
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.getGroupUsers = async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const isadmin = await adminChecker(req.user.id, groupId);

        const usersInGroup = await User.findAll({
            include: [{
                model: UserGroup,
                where: { groupId },
                attributes: ['isAdmin'], // Include only isAdmin column
            }],
            order: [
                [{ model: UserGroup }, 'isAdmin', 'DESC'] // Sort by isAdmin in descending order
            ]
        });
        res.setHeader('Isadmin', isadmin.toString());
        res.json(usersInGroup.map((user) => user.dataValues));
    } catch(err) {
        console.log(err);
        res.status(500).json({success: false, message: "Internal Server Error"});
    }
}

exports.getAvailableUsersForGroup = async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const isadmin = await adminChecker(req.user.id, groupId);

        // Find users who are not part of the specified group
        // Find the group by ID and include its associated users
        const group = await Group.findByPk(groupId, {
            include: [{
                model: User,
                through: { attributes: [] } // Exclude the join table attributes
            }]
        });

        // Get the IDs of users already in the group
        const usersInGroupIds = group.users.map(user => user.id);

        // Find users who are not part of the group
        const usersNotInGroup = await User.findAll({
            where: {
                id: {
                    [sequelize.Op.notIn]: usersInGroupIds // Exclude current user
                }
            }
        });
        res.setHeader('Isadmin', isadmin.toString());
        res.json(usersNotInGroup.map((user) => user.dataValues));
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};