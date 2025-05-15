const Exercise = require("../models/Exercise")


const getExercises = async (req, res) => {
    const { page = 1, limit = 10, exerciseName, targetMuscle, equipment } = req.query;

    const query = {};
    if (exerciseName) query.exerciseName = { $regex: exerciseName, $options: 'i' }; // case-insensitive search
    if (targetMuscle) query.primaryMuscle = targetMuscle;
    if (equipment) query.equipment = equipment;

    try {

        const count = await Exercise.countDocuments(query);
        if (count === 0) {
            return res.status(200).json({ message: "There are no exercises" });
        }

        const exercises = await Exercise.find(query)
            .skip((page - 1) * limit)
            .limit(limit);

        return res.status(200).json({
            exercises,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            count
        });

    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
};

const getExerciseById = async (req, res) => {
    const { exerciseId } = req.params
    if (!exerciseId) return res.status(400).json({ message: "No Id was provided" });
    try {
        const exercise = await Exercise.findOne({ exerciseId })

        if (!exercise) return res.status(404).json({ message: "exercise not found" })

        res.status(200).json({ exercise })

    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` })
    }
};

const addExercise = async (req, res) => {
    const {
        exerciseName, bodyPart, equipment, difficulty, type, primaryMuscle, secondaryMuscles,
        instructions, imageUrl } = req.body

    if (!exerciseName || !bodyPart || !equipment || !difficulty || !type
        || !primaryMuscle || !secondaryMuscles || !instructions || !imageUrl
    ) {
        return res.status(400).json({ message: "All fields must be filled" })
    }
    try {
        const exercise = await Exercise.create({
            exerciseName, bodyPart, equipment, difficulty, type, primaryMuscle, secondaryMuscles,
            instructions, imageUrl
        })
        res.status(201).json({ message: "Exercise succesfully created", exercise })
    } catch (error) {
        res.status(500).json({ error: `Server error: ${error.message}` })
    }

}

const getFavExercises = async (req, res) => {
    const { page = 1, limit = 10, exerciseName, targetMuscle, equipment } = req.query;
    const favoriteExercises = req.user.favoriteExercises;

    const query = {};
    query.exerciseId = { $in: favoriteExercises }
    if (exerciseName) query.exerciseName = { $regex: exerciseName, $options: 'i' }; // case-insensitive search
    if (targetMuscle) query.primaryMuscle = targetMuscle;
    if (equipment) query.equipment = equipment;

    try {

        const count = await Exercise.countDocuments(query);
        if (count === 0) {
            return res.status(200).json({ message: "There are no exercises" });
        }

        const exercises = await Exercise.find(query)
            .skip((page - 1) * limit)
            .limit(limit);

        return res.status(200).json({
            exercises,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            count
        });

    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
};




module.exports = {
    getExercises, getExerciseById, addExercise,getFavExercises
}