const mongoose = require("mongoose");    
async function connectDB() {
    await mongoose.connect("CONNECTION_STRING_PROVIDED_BY_MONGO");
    
    console.log('DB CONNECTED');
}

module.exports = connectDB;
