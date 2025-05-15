const mongoose = require('mongoose')
const AutoIncrement = require('mongoose-sequence')(mongoose);

const ExerciseSchema = new mongoose.Schema({
    exerciseId: {
        type: Number
    },
    exerciseName: {
        type: String,
    },
    difficulty: {
        type: String,
    },
    type: {
        type: String,
    },
    equipment: {
        type: String,
    },
    bodyPart: {
        type: String,
    },
    primaryMuscle: {
        type: String,
    },
    secondaryMuscles: [{
        type: String,
    }],
    instructions: [{
        type: String,
    }],
    imageUrl: {
        type: String,
    }


}, { timestamps: true })

ExerciseSchema.plugin(AutoIncrement, { inc_field: 'exerciseId', start_seq: 1 });

const Exercise = mongoose.model("Exercise", ExerciseSchema)

module.exports = Exercise