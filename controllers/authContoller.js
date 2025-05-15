const User = require("../models/User")
const bcrypt = require('bcryptjs')
const JWT = require('jsonwebtoken')
const { sendEmail } = require("../services/emailService")
require('dotenv').config()



/* --------------------------------------------------- */
const createToken = (id) => {
    return JWT.sign({ id }, process.env.SECRET_PHRASE)
}
/* --------------------------------------------------- */

const isValidEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}
/* --------------------------------------------------- */

const Register = async (req, res) => {
    const {
        username, email, password
    } = req.body

    if (!username || !email || !password) {
        return res.status(400).json({ message: "All fields must be filled" })
    }
    if (!isValidEmail(email)) {
        return res.status(400).json({ message: "Email format is not right" })
    }
    const exist = await User.findOne({ email })
    if (exist) {
        return res.status(400).json({ message: "Email already taken" })
    }
    try {
        const salt = await bcrypt.genSalt()
        const hashed = await bcrypt.hash(password, salt)

        const user = await User.create({
            username, email, password: hashed
        })
        const token = createToken(user.userId)

        res.status(201).json({ message: "User succesfully created", user, token })
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` })
    }
}

const Login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "All fields must be filled" })
    }
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Incorrect email" })
        }
        const validPassword = await bcrypt.compare(password, user.password)
        if (!validPassword) {
            return res.status(400).json({ message: "Incorrect password" })
        }

        const token = createToken(user.userId)

        res
            .status(200)
            .json({ message: "User signed in", user, token });
    } catch (error) {
        return res.status(500).json({ message: `Server error: ${error.message}` })
    }
};


const Google = async (req, res) => {
    const { email, name } = req.body
    try {
        const user = await User.findOne({ email });
        if (user) {
            const token = createToken(user.userId)

            res
                .status(200)
                .json({ message: "User signed in", token });
        } else {
            const newUser = User.create({
                username:
                    name.split(' ').join('').toLowerCase(),
                email
            })

            const token = createToken(newUser.userId)

            res
                .status(200)
                .json({ message: "User is Saved to DB And signed in", token });
        }
    } catch (error) {
        return res.status(500).json({ message: `Server error: ${error.message}` })
    }
};

const verifyUserEmail = async (req, res) => {
    const { email } = req.body

    if (!email) return res.status(400).json({ message: "No email was provided" });

    try {
        const user = await User.findOne({ email })

        if (!user) return res.status(404).json({ message: "No user with this email" })

        const resetCode = Math.floor(100000 + Math.random() * 900000);
        user.resetCode = resetCode;
        await user.save();
        sendEmail(email, "Forgot Password", `Your resetCode is ${resetCode}`)
        res.status(200).json({ user })

    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` })
    }
};
const verifyUserResetCode = async (req, res) => {
    const { email, resetCode } = req.body

    if (!email || !resetCode) return res.status(400).json({ message: "All fields are required" });

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.resetCode != resetCode) {
            return res.status(500).json({ message: "Reset Code is wrong" });
        }
        res.status(200).json({ user, message: "Reset code is right" })

    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` })
    }
};

const resetPassword = async (req, res) => {
    const { newPassword, email, resetCode } = req.body;

    if (!newPassword || !email || !resetCode) {
        return res.status(400).json({ message: "All fields are required" });
    }
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.resetCode !== resetCode) {
            return res.status(500).json({ message: "Reset Code is wrong" });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetCode = null;
        await user.save();

        const { password, ...userWithNoPass } = user._doc
        res.json({ message: "User password is updated successfully", user: userWithNoPass });
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
};


module.exports = { Register, Google, Login, verifyUserEmail, verifyUserResetCode, resetPassword }