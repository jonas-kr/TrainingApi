const mongoose = require('mongoose')
const AutoIncrement = require('mongoose-sequence')(mongoose);

const ProgramSchema = new mongoose.Schema({
    programId: {
        type: Number
    },
    name: {
        type: String
    },
    createdBy: {
        type: Number,
        ref: "User",
    },
    savedBy: {
        type: Number,
        ref: "User",
    },
    imageUrl: {
        type: String
    },
    goal: {
        type: String
    },
    level: {
        type: String
    },
    daysPerWeek: {
        type: Number
    },
    description: {
        type: String
    },
    isPrivate: {
        type: Boolean
    },
    ratings: [{
        value: { type: Number },
        user: { type: Number, ref: "User" },
    }],
    workouts: [{
        title: { type: String },
        exercises: [{
            exercise: { type: Number, ref: "Exercise" },
            sets: [{
                typeOfSet: String,
                weight: Number,
                reps: Number
            }]
        }]
    }]
}, { timestamps: true })

ProgramSchema.plugin(AutoIncrement, { inc_field: 'programId', start_seq: 1 });

const Program = mongoose.model("Program", ProgramSchema)

module.exports = Program