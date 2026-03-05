const mongoose = require("mongoose");   
console.log ("in db.js");
async function connectDB() {
    try {
        await mongoose.connect("mongodb+srv://BackendTutorialMongoDB:6dYPeezz7LYyHn9m@cluster0.adwypev.mongodb.net", {
            serverSelectionTimeoutMS: 5000,
        });
        console.log('DB CONNECTED');
    } catch (error) {
        console.error('MongoDB Connection Error:', error.message);
        console.error('Error Code:', error.code);
        process.exit(1);
    }
}

module.exports = connectDB;