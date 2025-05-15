const mongoose = require('mongoose')
const AutoIncrement = require('mongoose-sequence')(mongoose);


const notificationSchema = new mongoose.Schema({
    notificationId: {
        type: Number,
    },
    from: {
        type: Number,
        ref: "User",
        required: true
    },
    to: {
        type: Number,
        ref: "User",
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['follow', 'like', 'comment', 'save']
    },
    isSeen: {
        type: Boolean,
        default: false
    },
    session: {
        type: Number,
        ref: "Session",
    },
    program: {
        type: Number,
        ref: "Program",
    },

}, { timestamps: true })

notificationSchema.plugin(AutoIncrement, { inc_field: 'notificationId', start_seq: 1 });

const Notification = mongoose.model("Notification", notificationSchema)

module.exports = Notification