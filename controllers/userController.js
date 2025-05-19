const bcrypt = require('bcryptjs')
const User = require("../models/User")
const Program = require('../models/Program')
const Session = require('../models/Session')
const Progress = require('../models/Progress')
const Notification = require("../models/Notification")

const getUser = async (req, res) => {
    const { userId } = req.params
    if (!userId) return res.status(400).json({ message: "No username was provided" });
    try {
        const user = await User.findOne({ userId })

        if (!user) return res.status(404).json({ message: "User not found" })

        const { password, ...userWithNowPass } = user._doc

        res.status(200).json({ user: userWithNowPass })

    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` })
    }
}

const getUserFollowers = async (req, res) => {
    const { userId } = req.params
    if (!userId) return res.status(400).json({ message: "No userId was provided" });
    try {
        const user = await User.findOne({ userId }).populate({
            path: 'followers',
            model: 'User',
            localField: 'userId',
            foreignField: 'userId',
            select: "-password -_id -__v"
        }).exec();

        if (!user) return res.status(404).json({ message: "User not found" })

        res.status(200).json({ userFollowers: user.followers })

    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` })
    }
};

const getUserFollowing = async (req, res) => {
    const { userId } = req.params
    if (!userId) return res.status(400).json({ message: "No userId was provided" });
    try {
        const user = await User.findOne({ userId }).populate({
            path: 'following',
            model: 'User',
            localField: 'userId',
            foreignField: 'userId',
            select: "-password -_id -__v"
        }).exec();

        if (!user) return res.status(404).json({ message: "User not found" })


        res.status(200).json({ userFollowing: user.following })

    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` })
    }
};

const getUserLibraryPrograms = async (req, res) => {
    const userId = req.user.userId;
    try {
        const libraryPrograms = await Program.find({ savedBy: userId });

        if (!libraryPrograms) return res.status(404).json({ message: "No Library programs were found" })


        res.status(200).json({ libraryPrograms })

    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` })
    }
};

const getUserSharedPrograms = async (req, res) => {
    const { userId } = req.params;
    try {
        const sharedPrograms = await Program.find({ createdBy: userId, isPrivate: false });

        if (!sharedPrograms) return res.status(404).json({ message: "No Shared programs were found" })


        res.status(200).json({ sharedPrograms })

    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` })
    }
};


const followUnfollowUser = async (req, res) => {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ message: "No userId was provided" });
    if (parseInt(userId) === req.user.userId) return res.status(400).json({ message: "You can't follow / unfollow yourself!" });

    try {
        const userToModify = await User.findOne({ userId });
        const currentUser = req.user;
        if (!userToModify) return res.status(404).json({ message: "User not found" });

        const isFollowing = currentUser.following.includes(userId);
        if (isFollowing) {//unfollow
            await User.updateOne({ userId }, { $pull: { followers: currentUser.userId } });
            await User.updateOne({ userId: currentUser.userId }, { $pull: { following: userId } });

            await Notification.deleteOne({ type: "follow", from: req.user.userId, to: userId })

            res.status(200).json({ message: "User unfollowed successfully", followed: false })
        } else { //follow
            await User.updateOne({ userId }, { $push: { followers: currentUser.userId } });
            await User.updateOne({ userId: currentUser.userId }, { $push: { following: userId } });
            //send Notification to user
            await Notification.create({ type: "follow", from: req.user.userId, to: userId })

            res.status(200).json({ message: "User followed successfully", followed: true })
        }

    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` })
    }
};
const removeFollower = async (req, res) => {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ message: "No userId was provided" });
    if (parseInt(userId) === req.user.userId) return res.status(400).json({ message: "You can't follow / unfollow yourself!" });

    try {
        const userToModify = await User.findOne({ userId });
        const currentUser = req.user;
        if (!userToModify) return res.status(404).json({ message: "User not found" });

        const isFollowing = currentUser.followers.includes(userId);
        if (isFollowing) {
            await User.updateOne({ userId }, { $pull: { following: currentUser.userId } });
            await User.updateOne({ userId: currentUser.userId }, { $pull: { followers: userId } });

            res.status(200).json({ message: "removed follower successfully", followed: false })
        } else {
            res.status(200).json({ message: "This user is not following you" })
        }

    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` })
    }
};

const getPopularUsers = async (req, res) => {
    try {
        const userId = req.user.userId;
        const usersFollowedByMe = req.user.following;  // This is an array of userId


        const suggestedUsers = await User.aggregate([
            {
                $match: {
                    _id: { $ne: userId, $nin: usersFollowedByMe }, // Exclude current user and followed users
                },
            },
            {
                $sample: { size: 10 }, // Get a random sample of 10 users
            },
            {
                $project: {
                    password: 0, // Exclude password field
                    __v: 0 // Optionally exclude the version key
                },
            },
        ]);

        if (!suggestedUsers) return res.status(404).json({ message: "No user found" });

        res.status(200).json(suggestedUsers);
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
};

const addWeight = async (req, res) => {
    const { value } = req.body

    try {
        await User.updateOne({ userId: req.user.userId }, { $push: { weight: { value } } });

        res.status(200).json({ message: "Weight added successfully" })

    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` })
    }

}

const updateProfile = async (req, res) => {
    const { username, birthdate, gender, height, bio, profilePic } = req.body;
    const userId = req.user.userId;

    try {
        const user = await User.findOne({ userId });
        
        if (username) user.username = username
        if (birthdate) user.birthdate = birthdate;
        if (bio) user.bio = bio;
        if (height) user.height = height;
        if (profilePic) user.profilePic = profilePic;
        user.gender = gender;

        await user.save();
        const { password, ...userWithNoPass } = user._doc
        res.json({ message: "User is updated successfully", user: userWithNoPass });
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
};

const updateEmail = async (req, res) => {
    const { email, password } = req.body;
    const userId = req.user.userId;
    if (!email || !password) {
        return res.status(400).json({ message: "All fields must be filled" })
    }
    try {
        const user = await User.findOne({ userId });

        const validPassword = await bcrypt.compare(password, user.password)
        if (!validPassword) {
            return res.status(400).json({ message: "Incorrect password" })
        }

        user.email = email;

        await user.save();
        const { password, ...userWithNoPass } = user._doc
        res.json({ message: "User email is updated successfully", user: userWithNoPass });
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
};

const updatePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;
    if ((!currentPassword && newPassword) || (!newPassword && currentPassword)) return res.status(400).json({ message: "Please provide both current password and new password" });

    try {
        const user = await User.findOne({ userId });
        if (!user) return res.status(404).json({ message: "User not found" });

        if (newPassword && currentPassword) {
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });
            if (newPassword.length < 6) return res.status(400).json({ message: "New password must be at least 6 characters long" });

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        await user.save();
        const { password, ...userWithNoPass } = user._doc
        res.json({ message: "User password is updated successfully", user: userWithNoPass });
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
};


const removeUser = async (req, res) => {
    const userId = req.user.userId;

    try {
        await User.deleteOne({ userId });
        await Session.deleteMany({ user: userId });
        await Program.deleteMany({ savedBy: userId });
        await Progress.deleteMany({ user: userId });

        res.status(200).json({ message: "User deleted successfully" });

    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
};

const addExerciseRemoveExercise = async (req, res) => {
    const { exerciseId } = req.params;
    const userId = req.user.userId;
    if (!exerciseId) return res.status(400).json({ message: "No exerciseId was provided" });

    try {
        const currentUser = req.user;
        const isFavorite = currentUser.favoriteExercises.includes(exerciseId);

        if (isFavorite) {//remove
            await User.updateOne({ userId }, { $pull: { favoriteExercises: exerciseId } });

            res.status(200).json({ message: "User remove exercise from favorite successfully", favorite: false })
        } else { //Add
            await User.updateOne({ userId }, { $push: { favoriteExercises: exerciseId } });

            res.status(200).json({ message: "User Add exercise to favorite successfully", favorite: true })
        }

    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` })
    }
}

const addLibraryProgram = async (req, res) => {
    const { programId } = req.params;
    const userId = req.user.userId

    if (!programId) return res.status(404).json({ message: "No programID was provided" })

    try {
        const program = await Program.findOne({ programId });
        if (!program) return res.status(404).json({ message: "No program with this ID" })

        const libraryProgram = await Program.create({
            name: program.name, description: program.description, level: program.level,
            goal: program.goal, daysPerWeek: program.daysPerWeek, isPrivate: true,
            workouts: program.workouts, imageUrl: program.imageUrl,
            createdBy: program.createdBy, savedBy: userId
        })
        await Notification.create({
            type: "save", from: req.user.userId, to: program.createdBy,
            context: programId
        })

        res.status(201).json({ message: "Program succesfully created", libraryProgram })
    } catch (error) {
        res.status(500).json({ error: `Server error: ${error.message}` })
    }
}

const getUsers = async (req, res) => {
    const { username } = req.params;
    if (!username) return res.status(400).json({ message: "No username was provided" });

    try {
        const query = {
            username: { $regex: username, $options: 'i' } // case-insensitive search
        };

        const users = await User.find(query).select('-password');

        if (!users || users.length === 0) {
            return res.status(404).json({ message: "No users were found" });
        }

        res.status(200).json({ users });

    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
};


module.exports = {
    getUser, getUserFollowing, getUserFollowers, followUnfollowUser, getPopularUsers, addWeight, updateProfile,
    updatePassword, removeUser, addExerciseRemoveExercise, getUserLibraryPrograms, addLibraryProgram,
    getUserSharedPrograms, getUsers, removeFollower, updateEmail
}