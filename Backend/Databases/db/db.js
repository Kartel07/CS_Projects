const mongoose = require("mongoose");    
async function connectDB() {
    await mongoose.connect("mongodb+srv://BackendTutorialMongoDB:<YOUR_DB_PASSWORD>@cluster0.adwypev.mongodb.net/?appName=<CLUSTERNAME>");
    
    console.log('DB CONNECTED');
}

module.exports = connectDB;
