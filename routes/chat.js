const express = require('express');
const router = express.Router();

const userAuthentication = require('../middlewares/auth');
// const s3Upload = require('../middlewares/uploadToS3');
const chatController = require('../controllers/chat');

router.post('/chat', userAuthentication.authenticate, chatController.createChat);
router.get('/chat/:groupId', userAuthentication.authenticate, chatController.getChats);
router.post('/send-file', userAuthentication.authenticate, chatController.uploadFile, chatController.sendFile);

module.exports = router;