const userModel = require("../models/user.model");

async function registerUser(req,res){
    const {username,email,password} = req.body;
    const user = new userModel({username,email,password});
    await user.save();
    res.status(201).json({message: "User registered successfully"});
}

module.exports = {registerUser};