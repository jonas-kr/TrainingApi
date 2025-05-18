const Program = require('../models/Program')

const getPublicPrograms = async (req, res) => {
    const { page = 1, limit = 10, name, level, goal, daysPerWeek } = req.query;

    const query = {};
    if (name) query.name = { $regex: name, $options: 'i' }; // case-insensitive search
    if (level) query.level = level;
    if (goal) query.goal = goal;
    if (daysPerWeek) query.daysPerWeek = daysPerWeek;
    query.isPrivate = false;


    try {
        const count = await Program.countDocuments(query);
        if (count === 0) {
            return res.status(200).json({ message: "There are no programs" });
        }

        const programs = await Program.find(query)
            .skip((page - 1) * limit)
            .limit(limit);

        return res.status(200).json({
            programs,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            count
        });

    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
}

const getTopRatedPrograms = async (req, res) => {
    try {
        const topPrograms = await Program.aggregate([
            {
                $addFields: {
                    avgRating: { $avg: "$ratings.value" }
                }
            },
            {
                $sort: { avgRating: -1 }
            },
            {
                $limit: 10
            }
        ]);

        if (!topPrograms) return res.status(404).json({ message: "No programs Found" })
        res.status(200).json(topPrograms);

    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
}


const addProgram = async (req, res) => {
    const { name, description, level, goal, daysPerWeek, isPrivate, imageUrl } = req.body
    const userId = req.user.userId

    if (!name) {
        return res.status(400).json({ message: "All fields must be filled" })
    }
    try {
        const program = await Program.create({
            name, description, level, goal, daysPerWeek, isPrivate, createdBy: userId, savedBy: userId, imageUrl
        })
        res.status(201).json({ message: "Program succesfully created", program })
    } catch (error) {
        res.status(500).json({ error: `Server error: ${error.message}` })
    }

}

const updateProgram = async (req, res) => {
    const { name, description, level, goal, daysPerWeek, isPrivate, imageUrl } = req.body;
    const userId = req.user.userId;
    const { programId } = req.params

    try {
        const program = await Program.findOne({ programId });

        if (program.savedBy !== userId) return res.status(400).json({ message: "you can't update this program" })

        if (name) program.name = name;
        if (description) program.description = description;
        if (level) program.level = level;
        if (goal) program.goal = goal;
        if (imageUrl) program.imageUrl = imageUrl;
        if (daysPerWeek) program.daysPerWeek = daysPerWeek;
        program.isPrivate = isPrivate;

        await program.save();

        const updatedProgram = await Program.findOne({ programId })
        .populate({
            path: 'createdBy',
            model: 'User',
            localField: 'userId',
            foreignField: 'userId',
            select: "-password -_id -__v -weight -favoriteExercises -programLibrary	-followers -following"
        }).populate({
            path: 'workouts.exercises.exercise',
            model: 'Exercise',
            localField: 'exerciseId',
            foreignField: 'exerciseId',
            select: "-_id -__v -instructions"
        }).exec();

        res.json({ message: "User updated program successfully", program: updatedProgram });
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
};

const addWorkout = async (req, res) => {
    const { workout, programId } = req.body;
    const userId = req.user.userId;

    try {
        const program = await Program.findOne({ programId });
        if (!program) {
            return res.status(404).json({ message: "Program not found" });
        }
        if (program.savedBy !== userId) {
            return res.status(403).json({ message: "You can't update this program" });
        }

        await Program.updateOne(
            { programId },
            { $push: { workouts: workout } }
        );

         const updatedProgram = await Program.findOne({ programId }).populate({
            path: 'createdBy',
            model: 'User',
            localField: 'userId',
            foreignField: 'userId',
            select: "-password -_id -__v -weight -favoriteExercises -programLibrary	-followers -following"
        }).populate({
            path: 'workouts.exercises.exercise',
            model: 'Exercise',
            localField: 'exerciseId',
            foreignField: 'exerciseId',
            select: "-_id -__v -instructions"
        }).exec();

        res.json({ message: "User add workout successfully", program :updatedProgram });
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
};


const updateWorkout = async (req, res) => {
    const { index, workout, programId } = req.body;
    const userId = req.user.userId;

    try {
        const program = await Program.findOne({ programId });

        if (!program) {
            return res.status(404).json({ message: "Program not found" });
        }

        if (program.savedBy !== userId) {
            return res.status(403).json({ message: "You can't update this program" });
        }

        if (workout && index >= 0 && index < program.workouts.length) {
            program.workouts[index] = workout;
            await program.save();

            const updatedProgram = await Program.findOne({ programId }).populate({
                path: 'createdBy',
                model: 'User',
                localField: 'userId',
                foreignField: 'userId',
                select: "-password -_id -__v -weight -favoriteExercises -programLibrary	-followers -following"
            }).populate({
                path: 'workouts.exercises.exercise',
                model: 'Exercise',
                localField: 'exerciseId',
                foreignField: 'exerciseId',
                select: "-_id -__v -instructions"
            }).exec();

            return res.json({ message: "Workout updated successfully", program : updatedProgram });
        } else {
            return res.status(400).json({ message: "Invalid workout index" });
        }

    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
};


const deleteWorkout = async (req, res) => {
    const { index, programId } = req.query;
    const userId = req.user.userId;

    try {
        const program = await Program.findOne({ programId });

        if (!program) {
            return res.status(404).json({ message: "Program not found" });
        }

        if (program.savedBy !== userId) {
            return res.status(403).json({ message: "You can't update this program" });
        }

        if (index < 0 || index >= program.workouts.length) {
            return res.status(400).json({ message: "Invalid index" });
        }

        program.workouts.splice(index, 1);
        await program.save();

        res.json({ message: "Workout deleted successfully", program });
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
};



const deleteProgram = async (req, res) => {
    const userId = req.user.userId;
    const { programId } = req.params

    try {
        const program = await Program.findOne({ programId });

        if (program.savedBy !== userId) return res.status(400).json({ message: "you can't delete this program" })

        await Program.deleteOne({ programId });

        res.status(200).json({ message: "Program deleted successfully" });

    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
};

const rateProgram = async (req, res) => {
    const { value } = req.body
    const userId = req.user.userId
    const { programId } = req.params

    try {
        await Program.updateOne({ programId },{ $pull: { ratings: { user: userId } } });
        await Program.updateOne({ programId }, { $push: { ratings: { value, user: userId } } });

        res.status(200).json({ message: "Rating added successfully" })

    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` })
    }

}

const getProgram = async (req, res) => {
    const { programId } = req.params

    try {
        const program = await Program.findOne({ programId }).populate({
            path: 'createdBy',
            model: 'User',
            localField: 'userId',
            foreignField: 'userId',
            select: "-password -_id -__v -weight -favoriteExercises -programLibrary	-followers -following"
        }).populate({
            path: 'workouts.exercises.exercise',
            model: 'Exercise',
            localField: 'exerciseId',
            foreignField: 'exerciseId',
            select: "-_id -__v -instructions"
        }).exec();


        if (!program) return res.status(404).json({ message: "No program with this id was Found" })
        res.status(200).json({ program });
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
}


module.exports = {
    getPublicPrograms, getTopRatedPrograms, addProgram, updateProgram,
    deleteProgram, rateProgram, getProgram, addWorkout, updateWorkout, deleteWorkout
}