const mongoose = require('mongoose')
const AutoIncrement = require('mongoose-sequence')(mongoose);

const UserSchema = new mongoose.Schema({
    userId: {
        type: Number
    },
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
    },
    profilePic: {
        type: String,
    },
    bio: { type: String },
    birthdate: { type: Date },
    gender: { type: Boolean },
    height: { type: String },
    resetCode: { type: Number },

    weight: [{
        value: Number,
        date: { type: Date, default: Date.now }
    }],
    followers: [{
        type: Number,
        ref: "User",
        default: []
    }],
    following: [{
        type: Number,
        ref: "User",
        default: []
    }],
    programLibrary: [{
        type: Number,
        ref: "Program",
        default: []
    }],
    favoriteExercises: [{
        type: Number,
        ref: "Exercise",
        default: []
    }]
}, { timestamps: true })

UserSchema.plugin(AutoIncrement, { inc_field: 'userId', start_seq: 1 });

const User = mongoose.model("User", UserSchema)

module.exports = User