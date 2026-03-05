require('dotenv').config();
const app = require("./src/app");
const connectDB = require("./db/db");

connectDB();

app.listen(3000,(res,req)=>{
    console.log("Server is running on port 3000");
})