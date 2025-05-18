const mongoose = require('mongoose')
const AutoIncrement = require('mongoose-sequence')(mongoose);

const ProgressSchema = new mongoose.Schema({
    progressId: {
        type: Number
    },
    user: {
        type: Number, ref: "User"
    },
    exercise: { type: Number, ref: "Exercise" },
    history: [{ 
        sessionId : {type: Number, ref: "Session"}, 
        sets: [{
            typeOfSet: { type: String },
            weight: { type: Number },
            reps: { type: Number },
            oneRM: { type: Number },
        }    // 1rm = weight * (1 + (reps/30) ) } 
        ]
    }],
    heaviestWeight: {
        value: { type: Number },
        workout: { type: Number, ref: "Session" }
    },
    bestOneRM: {
        value: { type: Number },
        workout: { type: Number, ref: "Session" }
    },
    bestSetVolume: {
        value: { type: Number },
        workout: { type: Number, ref: "Session" }
    },
    bestSessionVolume: {
        value: { type: Number },
        workout: { type: Number, ref: "Session" }
    },
    totalReps: { type: Number },
    totalVolume: { type: Number },


}, { timestamps: true })

ProgressSchema.plugin(AutoIncrement, { inc_field: 'progressId', start_seq: 1 });

const Progress = mongoose.model("Progress", ProgressSchema)

module.exports = Progress