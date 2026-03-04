const mongoose = require("mongoose");    
async function connectDB() {
    await mongoose.connect("mongodb+srv://BackendTutorialMongoDB:6dYPeezz7LYyHn9m@cluster0.adwypev.mongodb.net/?appName=Cluster0");
    
    console.log('DB CONNECTED');
}

module.exports = connectDB;