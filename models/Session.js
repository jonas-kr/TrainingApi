const mongoose = require('mongoose')
const AutoIncrement = require('mongoose-sequence')(mongoose);

const SessionSchema = new mongoose.Schema({
    sessionId: {
        type: Number
    },
    user: {
        type: Number,
        ref: "User"
    },
    program: {
        type: Number,
        ref: "Program",
    },
    title: {
        type: String
    },
    description: {
        type: String
    },
    imageUrl: {
        type: String
    },
    date: {
        type: Date
    },
    duration: {
        type: Number
    },
    likes: [{ type: Number, ref: "User" }],
    comments: [{
        user: { type: Number, ref: "User" },
        value: { type: String },
        date: { type: Date }
    }],
    performedExercises: [{
        exercise: { type: Number, ref: "Exercise" },
        sets: [{
            typeOfSet: { type: String },
            weight: { type: Number },
            reps: { type: Number },
            oneRM: { type: Number },
        }    // 1rm = weight * (1 + (reps/30) ) } 
        ]
    }
    ]

}, { timestamps: true })

SessionSchema.plugin(AutoIncrement, { inc_field: 'sessionId', start_seq: 1 });

const Session = mongoose.model("Session", SessionSchema)

module.exports = Session