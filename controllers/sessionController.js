const Session = require("../models/Session")
const Notification = require("../models/Notification");
const { calcHeatmap } = require("../utils/calcHeatmap");
const { addExerciseProgress } = require("./progressController");


//////////////////////////////////////////////////////////////////////////////////
/* const MS_IN_DAY = 86_400_000;           // 24 h in ms
const DAYS_IN_ROW = 7;
const MS_IN_WEEK = MS_IN_DAY * DAYS_IN_ROW;

function buildLabel(endDate, index) {
    // bucket 0 : today‑6 → today
    const end = new Date(endDate.getTime() - MS_IN_WEEK * index);
    const start = new Date(end.getTime() - MS_IN_DAY * (DAYS_IN_ROW - 1));

    const fmt = (d) => d.toISOString().slice(0, 10);        // "YYYY‑MM‑DD"
    return `${fmt(start)} → ${fmt(end)}`;
} */

function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return [d.getUTCFullYear(), weekNo];
}

// Helper: Generate full list of weeks between two dates
function generateWeekRange(startDate, endDate) {
    const result = [];
    let current = new Date(startDate);

    while (current <= endDate) {
        const [year, week] = getWeekNumber(current);
        result.push({
            year,
            week,
            label: `${year}-W${week}`
        });

        // Move to next week
        current.setDate(current.getDate() + 7);
    }

    return result;
}


////////////////////////////////////////////////////////////////////////////////////////
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
            .sort({ date: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate({
                path: 'user',
                model: 'User',
                localField: 'userId',
                foreignField: 'userId',
                select: "-password -_id -__v -weight -favoriteExercises -programLibrary	-followers -following"
            })
            .populate({
                path: 'performedExercises.exercise',
                model: 'Exercise',
                localField: 'exerciseId',
                foreignField: 'exerciseId',
                select: "primaryMuscle secondaryMuscles exerciseName exerciseId imageUrl"
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
            .sort({ date: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate({
                path: 'user',
                model: 'User',
                localField: 'userId',
                foreignField: 'userId',
                select: "-password -_id -__v -weight -favoriteExercises -programLibrary	-followers -following"
            })
            .populate({
                path: 'performedExercises.exercise',
                model: 'Exercise',
                localField: 'exerciseId',
                foreignField: 'exerciseId',
                select: "primaryMuscle secondaryMuscles exerciseName exerciseId imageUrl"
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
                userId, sessionId: parseInt(session.sessionId), sets, exerciseId: exercise, heaviestWeight,
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
    const { program, title, description, imageUrl, date, duration } = req.body
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


        await session.save();

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

        await Session.deleteOne({ sessionId });

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
                notificationType: "like", from: req.user.userId, to: session.user,
                context: sessionId,
            })

            res.status(200).json({ message: "User disliked session successfully", liked: false })
        } else { //like
            await Session.updateOne({ sessionId }, { $push: { likes: userId } });
            if (req.user.userId != session.user) {

                await Notification.create({
                    notificationType: "like", from: req.user.userId, to: session.user,
                    context: sessionId, date: new Date()
                })
            }

            res.status(200).json({ message: "User liked session successfully", liked: true })
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

        await Session.updateOne({ sessionId }, { $push: { comments: { value, user: userId, date: new Date() } } });

        if (req.user.userId == session.user) return
        if (req.user.userId != session.user) {

            await Notification.create({
                notificationType: "comment", from: req.user.userId, to: session.user,
                context: sessionId, date: new Date()
            })
        }

        const newSession = await Session.findOne({ sessionId }).populate({
            path: 'comments.user',
            model: 'User',
            localField: 'userId',
            foreignField: 'userId',
            select: "-password -_id -__v -weight -favoriteExercises -programLibrary	-followers -following"
        }).exec();

        res.status(200).json({ message: "Comment added successfully", comments: newSession.comments })

    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` })
    }

}

const getComments = async (req, res) => {
    const { sessionId } = req.params;

    try {
        const session = await Session.findOne({ sessionId }).populate({
            path: 'comments.user',
            model: 'User',
            select: "-password -_id -__v -weight -favoriteExercises -programLibrary -followers -following"
        }).exec();

        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }
        if (session.comments.length == 0) {
            return res.status(404).json({ message: "no comments found" });
        }
        // Sort comments by date (descending)
        const sortedComments = session.comments.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.status(200).json({ message: "Comments fetched successfully", comments: sortedComments });

    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
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

const getWeeklyHeatmap = async (req, res) => {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ message: "No user ID provided" });

    try {
        // Week range: Saturday to Friday
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dayOfWeek = today.getDay(); 
        const daysSinceSaturday = (dayOfWeek + 1) % 7;
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - daysSinceSaturday);
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        // Fetch weekly sessions for the user
        const sessions = await Session.find({
            user: userId,
            createdAt: { $gte: startOfWeek, $lte: endOfWeek }
        }).populate({
            path: 'performedExercises.exercise',
            model: 'Exercise',
            localField: 'exerciseId',
            foreignField: 'exerciseId',
            select: "primaryMuscle secondaryMuscles exerciseName exerciseId imageUrl"
        }).select('performedExercises');


        // Combine all performedExercises across all sessions
        const allExercises = [];
        sessions.forEach(session => {
            session.performedExercises.forEach(exercise => {
                allExercises.push(exercise);
            });
        });
        console.log(allExercises)

        // Pass the full array to your existing function
        const heatmap = calcHeatmap(allExercises);

        res.status(200).json({
            heatmap,
            range: { from: startOfWeek, to: endOfWeek },
            totalExercises: allExercises.length
        });

    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
};



const getSessionLikes = async (req, res) => {
    const { sessionId } = req.params
    if (!sessionId) return res.status(400).json({ message: "No Id was provided" });
    try {
        const session = await Session.findOne({ sessionId }).populate({
            path: 'likes',
            model: 'User',
            localField: 'userId',
            foreignField: 'userId',
            select: "-password -_id -__v -weight -favoriteExercises -programLibrary -following"
        }).exec();

        if (!session) return res.status(404).json({ message: "Session not found" })

        //stats
        res.status(200).json({ likes: session.likes })

    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` })
    }
}
const getSessionComments = async (req, res) => {
    const { sessionId } = req.params
    if (!sessionId) return res.status(400).json({ message: "No Id was provided" });
    try {
        const session = await Session.findOne({ sessionId }).populate({
            path: 'comments.user',
            model: 'User',
            localField: 'userId',
            foreignField: 'userId',
            select: "-password -_id -__v -weight -favoriteExercises -programLibrary	-followers -following -resetCode"
        }).exec();

        if (!session) return res.status(404).json({ message: "Session not found" })

        const sortedComments = session.comments.sort((a, b) => new Date(b.date) - new Date(a.date));

        //stats
        res.status(200).json({ comments: sortedComments })

    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` })
    }
}

const getUserStats = async (req, res) => {
    const { allTime = false, nbrWeeks, userId } = req.query;

    let count;
    let hours;
    let minutes;
    let totalWeight = 0;

    try {
        let filter = { user: userId };
        if (allTime !== "true" && allTime !== true) {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7 * parseInt(nbrWeeks));
            filter.date = { $gte: weekAgo };
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

const getWeeklyUserStats = async (req, res) => {
    const { allTime = false, nbrWeeks = 4, userId } = req.query;

    try {
        let startDate = new Date();
        let numberOfWeeks = parseInt(nbrWeeks - 1);

        if (allTime === "true" || allTime === true) {
            // Fetch earliest session to determine start date
            const firstSession = await Session.findOne({ user: userId }).sort({ date: 1 });
            if (firstSession) {
                startDate = new Date(firstSession.date);
            }
        } else {
            startDate.setDate(startDate.getDate() - 7 * numberOfWeeks);
        }

        const today = new Date();
        const allWeeks = generateWeekRange(startDate, today);

        const sessions = await Session.find({
            user: userId,
            date: { $gte: startDate, $lte: today }
        });

        const weeksMap = new Map();

        // Group sessions into weeks
        sessions.forEach(session => {
            const [year, weekNumber] = getWeekNumber(new Date(session.date));
            const key = `${year}-W${weekNumber}`;

            if (!weeksMap.has(key)) {
                weeksMap.set(key, {
                    totalSessions: 0,
                    totalMinutes: 0,
                    totalWeight: 0
                });
            }

            const data = weeksMap.get(key);
            data.totalSessions += 1;
            const duration = parseInt(session.duration) || 0;
            data.totalMinutes += duration;

            session.performedExercises.forEach(ex => {
                ex.sets.forEach(set => {
                    const weight = set.weight || 0;
                    const reps = set.reps || 0;
                    data.totalWeight += weight * reps;
                });
            });
        });

        // Build full list with zero-fill
        const weeklyStats = allWeeks.map(({ year, week, label }) => {
            const key = `${year}-W${week}`;
            const data = weeksMap.get(key) || {
                totalSessions: 0,
                totalMinutes: 0,
                totalWeight: 0
            };

            return {
                week: label,
                totalSessions: data.totalSessions,
                duration: {
                    hours: Math.floor(data.totalMinutes / 60),
                    minutes: data.totalMinutes % 60
                },
                totalWeight: data.totalWeight
            };
        });

        res.status(200).json({ weeklyStats });
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
};




module.exports = {
    getSessions, getHomeFeed, addSession, editSession, deleteSession, likeUnlikeSession,
    addComment, getSessionDetails, getUserStats, getSessionLikes, getSessionComments, getWeeklyUserStats,
    getComments, getWeeklyHeatmap
}