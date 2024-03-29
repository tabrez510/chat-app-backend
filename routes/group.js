const express = require('express');
const router = express.Router();
const groupController = require('../controllers/group');
const userAuthentication = require('../middlewares/auth');

router.post('/create-group', userAuthentication.authenticate, groupController.createGroup);
router.get('/get-groups', userAuthentication.authenticate, groupController.getGroups);
router.post('/add-user', userAuthentication.authenticate, groupController.addUserToGroup);
router.post('/remove-user', userAuthentication.authenticate, groupController.removeUserFromGroup);
router.post('/make-admin', userAuthentication.authenticate, groupController.makeAdmin);
router.post('/remove-admin', userAuthentication.authenticate, groupController.removeAdmin);
router.get('/get-group-users/:groupId', userAuthentication.authenticate, groupController.getGroupUsers);
router.get('/get-available-users/:groupId', userAuthentication.authenticate, groupController.getAvailableUsersForGroup);

module.exports = router;