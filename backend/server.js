const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));


mongoose.connect( MONGODB_URL , {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("MongoDB Connected"))
.catch(err => console.error(err));

const ScoreSchema = new mongoose.Schema({
    user: String,
    score: [Number],
    userType: Number,
    needType: Number,
    date: { type: Date, default: Date.now }
});

const Score = mongoose.model("Score", ScoreSchema);


app.post("/save-score", async (req, res) => {
    try {
        const { user, score, userType, needType } = req.body;
        const newScore = new Score({ user, score, userType, needType });
        await newScore.save();
        res.json({ message: "Score saved successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Error saving score", error });
    }
});

app.get("/scores", async (req, res) => {
    const scores = await Score.find().sort({ date: -1 });
    res.json(scores);
});

app.listen(3000, () => console.log("Server running on port 3000"));