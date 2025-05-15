const JWT = require('jsonwebtoken');
const User = require('../models/User');


const authMiddleware = (req, res, next) => {
    const { authorization } = req.headers
    if (!authorization) {
        return res.status(401).json({ message: "Auth token NOT FOUND" })
    }

    try {
        JWT.verify(authorization, process.env.SECRET_PHRASE, async (err, user) => {
            if (err) return res.status(500).json({ message: "Token is not valid" })

            const userAcc = await User.findOne({ userId: user.id }).select('-password'); // Exclude password from the fetched user
            if (!userAcc) {
                return res.status(401).json({ message: 'Authentication invalid: User not found.' });
            }
            req.user = userAcc;

            next();
        });
    } catch (error) {
        return res.status(500).json({ message: ` ${error.message}` })
    }
}

module.exports = authMiddleware