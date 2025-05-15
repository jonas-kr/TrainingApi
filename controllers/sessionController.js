const Session = require("../models/Session")
const { calcHeatmap } = require("../utils/calcHeatmap");
const { addExerciseProgress } = require("./progressController");


const getHomeFeed = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user.userId;
    const following = req.user.following;
    const allUserIds = [...following, userId];

    try {

        const count = await Session.countDocuments({
            user: { $in: allUserIds }
        });
        if (count === 0) {
            return res.status(200).json({ message: "There are no Sessions" });
        }

        const sessions = await Session.find({
            user: { $in: allUserIds }
        })
            .skip((page - 1) * limit)
            .limit(limit).populate({
                path: 'user',
                model: 'User',
                localField: 'userId',
                foreignField: 'userId',
            select: "-password -_id -__v -weight -favoriteExercises -programLibrary	-followers -following"
            }).exec();

        return res.status(200).json({
            sessions,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            count
        });

    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
}


const getSessions = async (req, res) => {
    const { page = 1, limit = 10, userId } = req.query;

    try {

        const count = await Session.countDocuments({ user: userId });
        if (count == 0) {
            return res.status(200).json({ message: "There are no Sessions" });
        }

        const sessions = await Session.find({ user: userId })
            .skip((page - 1) * limit)
            .limit(limit).populate({
                path: 'user',
                model: 'User',
                localField: 'userId',
                foreignField: 'userId',
            select: "-password -_id -__v -weight -favoriteExercises -programLibrary	-followers -following"
            }).exec();

        return res.status(200).json({
            sessions,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            count
        });

    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
}

const addSession = async (req, res) => {
    const { program, title, description, imageUrl, date, duration, performedExercises } = req.body
    const userId = req.user.userId

    if (!title) {
        return res.status(400).json({ message: "All fields must be filled" })
    }
    try {
        const session = await Session.create({
            user: userId, program, title, description, imageUrl, date, duration, performedExercises
        })

        performedExercises.map(({ exercise, sets }) => {
            let heaviestWeight = 0;
            let bestOneRM = 0;
            let bestSetVolume = 0;
            let totalReps = 0;
            let totalVolume = 0;

            sets.forEach(({ weight, reps, oneRM }) => {
                heaviestWeight = Math.max(heaviestWeight, weight);
                bestOneRM = Math.max(bestOneRM, oneRM);
                const volume = weight * reps;
                bestSetVolume = Math.max(bestSetVolume, volume);
                totalReps += reps;
                totalVolume += volume;
            });


            addExerciseProgress({
                userId, sessionId: session.sessionId, exerciseId: exercise, heaviestWeight,
                bestOneRM, bestSetVolume, bestSessionVolume: totalVolume, totalReps, totalVolume
            })

        });


        /*  addExerciseProgress({ sessionId: session.sessionId, heaviestWeight,
              bestOneRM, bestSetVolume, bestSessionVolume, totalReps, totalVolume }) */

        res.status(201).json({ message: "Session succesfully created", session })
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` })
    }
}

const editSession = async (req, res) => {
    const { program, title, description, imageUrl, date, duration, performedExercises } = req.body
    const { sessionId } = req.params
    const userId = req.user.userId

    try {
        const session = await Session.findOne({ sessionId });

        if (session.user !== userId) return res.status(400).json({ message: "you can't update this Session" })

        if (program) session.program = program;
        if (description) session.description = description;
        if (title) session.title = title;
        if (imageUrl) session.imageUrl = imageUrl;
        if (date) session.date = date;
        if (duration) session.duration = duration;
        if (performedExercises) session.performedExercises = performedExercises;


        await program.save();

        res.json({ message: "User updated session successfully", session });
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` })
    }
}


const deleteSession = async (req, res) => {
    const userId = req.user.userId;
    const { sessionId } = req.params

    try {
        const session = await Session.findOne({ sessionId });

        if (session.user !== userId) return res.status(400).json({ message: "you can't delete this Session" })

        await User.deleteOne({ sessionId });

        res.status(200).json({ message: "Session deleted successfully" });

    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
};

const likeUnlikeSession = async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user.userId;

    if (!sessionId) return res.status(400).json({ message: "No sessionId was provided" });

    try {
        const session = await Session.findOne({ sessionId })
        const isLiked = session.likes.includes(userId);

        if (isLiked) {//dislike
            await Session.updateOne({ sessionId }, { $pull: { likes: userId } });
            await Notification.deleteOne({
                type: "like", from: req.user.userId, to: session.user,
                session: sessionId
            })

            res.status(200).json({ message: "User disliked session successfully" })
        } else { //like
            await Session.updateOne({ sessionId }, { $push: { likes: userId } });
            await Notification.create({
                type: "like", from: req.user.userId, to: session.user,
                session: sessionId
            })

            res.status(200).json({ message: "User liked session successfully" })
        }

    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` })
    }
}

const addComment = async (req, res) => {
    const { value } = req.body
    const userId = req.user.userId
    const { sessionId } = req.params

    try {
        const session = await Session.findOne({ sessionId })
        if (!session) return res.status(404).json({ message: "No session was found" });

        await Session.updateOne({ sessionId }, { $push: { comments: { value, user: userId } } });

        await Notification.create({
            type: "comment", from: req.user.userId, to: session.user,
            session: sessionId
        })

        res.status(200).json({ message: "Comment added successfully" })

    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` })
    }

}

const getSessionDetails = async (req, res) => {
    const { sessionId } = req.params
    if (!sessionId) return res.status(400).json({ message: "No Id was provided" });
    try {
        const session = await Session.findOne({ sessionId }).populate({
            path: 'performedExercises.exercise',
            model: 'Exercise',
            localField: 'exerciseId',
            foreignField: 'exerciseId',
            select: "primaryMuscle secondaryMuscles exerciseName exerciseId imageUrl"
        }).populate({
            path: 'user',
            model: 'User',
            localField: 'userId',
            foreignField: 'userId',
            select: "-password -_id -__v -weight -favoriteExercises -programLibrary	-followers -following"
        }).exec();

        if (!session) return res.status(404).json({ message: "Session not found" })

        //stats
        res.status(200).json({ session, heatmap: calcHeatmap(session.performedExercises) })

    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` })
    }
}

const getSessionLikes = async (req, res) => {
    const { sessionId } = req.params
    if (!sessionId) return res.status(400).json({ message: "No Id was provided" });
    try {
        const session = await Session.findOne({ sessionId }).populate({
            path: 'likes',
            model: 'User',
            localField: 'userId',
            foreignField: 'userId',
            select: "-password -_id -__v -weight -favoriteExercises -programLibrary	-followers -following"
        }).exec();

        if (!session) return res.status(404).json({ message: "Session not found" })

        //stats
        res.status(200).json({ Likes: session.likes })

    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` })
    }
}
const getSessionComments = async (req, res) => {
    const { sessionId } = req.params
    if (!sessionId) return res.status(400).json({ message: "No Id was provided" });
    try {
        const session = await Session.findOne({ sessionId }).populate({
            path: 'likes',
            model: 'User',
            localField: 'userId',
            foreignField: 'userId',
            select: "-password -_id -__v -weight -favoriteExercises -programLibrary	-followers -following"
        }).exec();

        if (!session) return res.status(404).json({ message: "Session not found" })

        //stats
        res.status(200).json({ Likes: session.likes })

    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` })
    }
}

const getUserStats = async (req, res) => {
    const { allTime = true, nbrWeeks, userId } = req.query;

    let count;
    let hours;
    let minutes;
    let totalWeight = 0;

    try {
        let filter = { user: userId };
        if (allTime !== "true" && allTime !== true) {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7 * parseInt(nbrWeeks));
            filter.createdAt = { $gte: weekAgo };
        }

        const sessions = await Session.find(filter);
        count = sessions.length;

        const totalMinutes = sessions.reduce((sum, session) => {
            return sum + (parseInt(session.duration) || 0);
        }, 0);

        hours = Math.floor(totalMinutes / 60);
        minutes = totalMinutes % 60;

        sessions.forEach(session => {
            session.performedExercises.forEach(ex => {
                ex.sets.forEach(set => {
                    const weight = set.weight || 0;
                    const reps = set.reps || 0;
                    totalWeight += weight * reps;
                });
            });
        });

        res.status(200).json({
            totalSessions: count,
            duration: { hours, minutes },
            totalWeight
        });

    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
};




module.exports = {
    getSessions, getHomeFeed, addSession, editSession, deleteSession, likeUnlikeSession,
    addComment, getSessionDetails, getUserStats, getSessionLikes,getSessionComments
}