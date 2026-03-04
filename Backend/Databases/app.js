const express = require('express');
const app = express();
const noteModel = require('./model/note.model');



//creating a middleware for data
app.use(express.json());
//creates notes array to store notes in memory

/*NEEDS TITLE AND DESCRIPTION*/
const notes = [];
//posts data on the server
app.post('/notes',async (req,res)=>{
    console.log(req.body);
    const data = req.body;
    await noteModel.create({
        title : data.title,
        description : data.description
    });
    res.status(201).json({message:"DATA TRANSFERED SUCCESSFULLY NOTE CREATED AND STORED IN DATABASE"});
});


//gets data from the server
app.get('/notes',async (req,res)=>{
    const notes = await noteModel.find();//finds all the notes in db
    //const notes = await noteModel.findone({
        //title: data.title
    // });//finds 1 note from db
    
    res.status(200).json({message:"DATA TRANSFERED SUCCESSFULLY", notes});
});

//deletes data from the server
app.delete('/notes/:id',async (req,res)=>{
    const id = req.params.id;
    await noteModel.findByIdAndDelete(id);
    res.status(200).json({message:"DATA TRANSFERED SUCCESSFULLY NOTE DELETED FROM DATABASE"});
});

//updates data on the server
app.put('/notes/:id',async (req,res)=>{
    const id = req.params.id;
    const data = req.body;
    await noteModel.findByIdAndUpdate(id,{
        title : data.title,
        description : data.description
    });
    res.status(200).json({message:"DATA TRANSFERED SUCCESSFULLY NOTE UPDATED IN DATABASE"});
});

module.exports =app;


/*npm i express mongoose to run the database*/