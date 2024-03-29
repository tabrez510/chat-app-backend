const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

require('dotenv').config();
const PORT = process.env.PORT || 3000;

const sequelize = require('./utils/database');
const initializeSocket = require('./socketHandler/socket');
const cronJob = require('./cron/cronJob');
const userRoutes = require('./routes/user');
const chatRoutes = require('./routes/chat');
const groupRoutes = require('./routes/group');

const User = require('./models/user');
const Chat = require('./models/chat');
const Group = require('./models/group');
const UserGroup = require('./models/usergroup');
const ArchivedChat = require('./models/archivedchat');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "http://127.0.0.1:5501"
    }
});
initializeSocket(io);

app.set('io', io);

// io.on('connection', async(socket) => {
//     console.log('User connected: ', socket.id);
//     const token = socket.handshake.query.token;
    
//     try {
//         const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
        
//         const userId = decoded.userId;

//         const user = await User.findByPk(userId);
//         if (user) {
//             user.socketId = socket.id;
//             await user.save();
//             console.log(`Socket ID updated for user ${userId}: ${socket.id}`);
//         } else {
//             console.log(`User with ID ${userId} not found.`);
//         }
//     } catch (error) {
//         console.error('Authentication error:', error);
//     }

//     socket.on('disconnect', () => {
//         console.log('User disconnected: ', socket.id);
//     });
// });

app.use(cors({
    origin: "http://127.0.0.1:5501",
    exposedHeaders: ['Isadmin', 'X-My-Custom-Header']
}));

app.use(bodyParser.json());

app.use('/api/user', userRoutes);
app.use('/api/user', chatRoutes);
app.use('/api/user', groupRoutes);

// app.use((req, res) => {
//     res.sendFile(path.join(__dirname, `public/${req.url}`))
// })

User.belongsToMany(Group, { through: UserGroup });
Group.belongsToMany(User, { through: UserGroup });

User.hasMany(UserGroup);
UserGroup.belongsTo(User);
Group.hasMany(UserGroup);
UserGroup.belongsTo(Group);

User.hasMany(Chat);
User.hasMany(ArchivedChat);
Chat.belongsTo(User);
ArchivedChat.belongsTo(User);

Group.hasMany(Chat);
Group.hasMany(ArchivedChat);
Chat.belongsTo(Group);
ArchivedChat.belongsTo(Group);

sequelize
    .sync({force: false})
    .then((res) => {
        server.listen(PORT);
        cronJob.start();
    })
    .catch((err) => {
        console.log(err);
    })