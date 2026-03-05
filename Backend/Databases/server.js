const app = require('./app'); //importing server instance from app.js
const connectDB = require('./db/db'); //importing database connection function from db.js

//connecting to the database
connectDB();



app.listen(3000,() =>{
    console.log("SERVER RUNNING ON PORT 3000");
});