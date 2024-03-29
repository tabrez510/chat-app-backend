const jwt = require('jsonwebtoken');
const User = require('../models/user');

exports.authenticate = async (req, res, next) => {
    try{
        const token = req.header('Authorization');
        if (!token) {
            return res.status(401).json({ success: false, message: 'Authorization token missing' });
        }
        
        const decryptUser = jwt.verify(token, process.env.TOKEN_SECRET);
        const user = await User.findByPk(decryptUser.userId);
        if(user) {
            req.user = user;
            
            next();
        } else {
            return res.status(404).json({success: false, message: 'User Not Found'});
        }
    } catch(err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token has expired' });
        } else if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        } else {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }
}