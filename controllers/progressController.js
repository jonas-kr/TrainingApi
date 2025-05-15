const Progress = require("../models/Progress")

const getProgress = async (req, res) => {
    const { exerciseId } = req.params
    const userId = req.user.userId;

    if (!exerciseId) return res.status(400).json({ message: "No Id was provided" });

    const query = {};
    query.exercise = exerciseId;
    query.user = userId;

    try {

        const progress = await Progress.findOne(query);
        if (!progress) {
            return res.status(200).json({ message: "There is no progress" });
        }

        return res.status(200).json({ progress });

    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
}

const addExerciseProgress = async ({ userId, sessionId, exerciseId, heaviestWeight, bestOneRM, bestSetVolume,
    bestSessionVolume, totalReps, totalVolume }) => {

    const query = {};
    query.exercise = exerciseId;
    query.user = userId;

    try {
        const progress = await Progress.findOne(query);

        if (!progress) {

            await Progress.create({
                user: userId, exercise: exerciseId, history: [sessionId],
                heaviestWeight: { value: heaviestWeight, workout: sessionId },
                bestOneRM: { value: bestOneRM, workout: sessionId },
                bestSetVolume: { value: bestSetVolume, workout: sessionId },
                bestSessionVolume: { value: bestSessionVolume, workout: sessionId },
                totalReps, totalVolume
            })

        } else {

            if (heaviestWeight > progress.heaviestWeight.value) progress.heaviestWeight = { value: heaviestWeight, workout: sessionId };
            if (bestOneRM > progress.bestOneRM.value) progress.bestOneRM = { value: bestOneRM, workout: sessionId };
            if (bestSetVolume > progress.bestSetVolume.value) progress.bestSetVolume = { value: bestSetVolume, workout: sessionId };
            if (bestSessionVolume > progress.bestSessionVolume.value) progress.bestSessionVolume = { value: bestSessionVolume, workout: sessionId };
            progress.totalReps += totalReps;
            progress.totalVolume += totalVolume;
            progress.history.push(sessionId)

            await progress.save()
        }

    } catch (error) {
        console.log({ message: `Server error: ${error.message}` })
    }
}

const getExerciseHistory = async (req, res) => {
    const { exerciseId } = req.params
    const userId = req.user.userId;

    if (!exerciseId) return res.status(400).json({ message: "No Id was provided" });

    const query = {};
    query.exercise = exerciseId;
    query.user = userId;

    try {

        const progress = await Progress.findOne(query).populate({
            path: 'history',
            model: 'Session',
            localField: 'sessionId',
            foreignField: 'sessionId',
            select: "-_id -v"
        }).exec();

        if (!progress) {
            return res.status(200).json({ message: "There is no progress" });
        }

        return res.status(200).json({ history: progress.history });

    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
}



module.exports = { getProgress, addExerciseProgress, getExerciseHistory }