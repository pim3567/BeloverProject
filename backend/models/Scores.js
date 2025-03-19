const mongoose = require('mongoose');

const ScoreSchema = new mongoose.Schema({
    user: String,
    score: [Number],
    userType: Number,
    needType: Number,
    date: { type: Date, default: Date.now }
});

const Score = mongoose.model("Score", ScoreSchema);