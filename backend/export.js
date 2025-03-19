const mongoose = require("mongoose");
const fs = require("fs");

// Connect to MongoDB Atlas
mongoose.connect( MONGODB_URL , {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB Connected"))
.catch(err => console.error(err));

// Define the Schema
const ScoreSchema = new mongoose.Schema({
    user: String,
    score: [Number],
    userType: Number,
    needType: Number,
    date: { type: Date, default: Date.now }
});

const Score = mongoose.model("Score", ScoreSchema);

// Export Data to JSON File
async function exportData() {
    const data = await Score.find();
    fs.writeFileSync("data_report.json", JSON.stringify(data, null, 2));
    console.log("Data exported to data.json!");
    mongoose.connection.close();
}

exportData();