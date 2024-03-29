const Chat = require('../models/chat');
const ArchivedChat = require('../models/archivedchat');
const Sequelize = require('sequelize');
const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

const s3 = new AWS.S3({
    accessKeyId: process.env.IAM_USER_KEY,
    secretAccessKey: process.env.IAM_USER_SECRET
});
  
// Configure multer middleware for file upload to S3
const upload = multer({
    storage: multerS3({
      s3: s3,
      bucket: process.env.BUCKET_NAME,
      acl: 'public-read',
      key: function (req, file, cb) {
        cb(null, Date.now().toString() + '-' + file.originalname);
      }
    })
});

exports.createChat = async(req, res) => {
    try {
        const {groupId, message, multimedia} = req.body;
        const mesg = await Chat.create({message, name: req.user.name, userId: req.user.id, groupId, multimedia});
        const io = req.app.get('io');
        io.to(groupId).emit('newMessage', mesg);
        res.json({success: true, ...mesg.dataValues, message: 'Message sent successfully'});
    } catch(err) {
        console.log(err);
        res.status(500).json({success: false, message: 'Internal Server Error'});
    }
}

exports.uploadFile = upload.single('file');

// exports.getChats = async(req, res) => {
//     try {
//         const lastId = req.query.lastMesgId;
//         const groupId = req.params.groupId;
//         let messages;

//         if (lastId) {
//             messages = await Chat.findAll({
//                 where: {
//                     id: {
//                         [Sequelize.Op.gt]: lastId
//                     },
//                     groupId
//                 }
//             });
//         } else {
//             messages = await Chat.findAll({
//                 where : {
//                     groupId
//                 }
//             });
//         }
//         console.log(messages);
//         res.json(messages.map((mesg) => mesg.dataValues));
//     } catch(err) {
//         console.log(err);
//         res.status(500).json({success: false, message: 'Internal Server Error'});
//     }
// }

exports.getChats = async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const cursor = req.query.cursor;
        const limit = parseInt(req.query.limit) || 20;

        let messages;

        if (cursor !== 'null') {
            const chatMessages = await Chat.findAll({
                where: {
                    groupId,
                    createdAt: { [Sequelize.Op.lt]: cursor }
                },
                order: [['createdAt', 'ASC']],
                limit: limit
            });

            const archivedChatMessages = await ArchivedChat.findAll({
                where: {
                    groupId,
                    createdAt: { [Sequelize.Op.lt]: cursor }
                },
                order: [['createdAt', 'ASC']],
                limit: limit - chatMessages.length
            });

            messages = [...chatMessages, ...archivedChatMessages];
        } else {
            const chatMessages = await Chat.findAll({
                where: { groupId },
                order: [['createdAt', 'DESC']],
                limit: limit
            });

            const archivedChatMessages = await ArchivedChat.findAll({
                where: { groupId },
                order: [['createdAt', 'DESC']], 
                limit: limit - chatMessages.length
            });

            messages = [...chatMessages, ...archivedChatMessages];
            messages.sort((a, b) => a.createdAt - b.createdAt);
        }


        res.json(messages.map((message) => message.dataValues));
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.sendFile = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }
  
      res.json({ success: true, url: req.file.location });
    } catch (error) {
      console.log('Error handling file upload:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};