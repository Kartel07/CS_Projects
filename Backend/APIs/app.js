const express = require('express');
const app = express(); //creates server instance

//creating a middleware for data
app.use(express.json());
//creates notes array to store notes in memory

/*NEEDS TITLE AND DESCRIPTION*/
const notes = [];
//posts data on the server
app.post('/notes',(req,res)=>{
    console.log(req.body);
    notes.push(req.body);
    res.status(201).json({message:"DATA TRANSFERED SUCCESSFULLY NOTE CREATED"});
});

//gets data from server

app.get('/notes',(req,res)=>{
    res.status(200).json({
        message: "notes fetched successfully",
        notes: notes
    });
});

//deleting data from server
app.delete('/notes/:index',(req,res)=>{
    const index = req.params.index; //index of note to be deleted
    delete notes[index];
    res.status(200).json({message:"NOTE DELETED SUCCESSFULLY"});
});


// appending/updating data on server
app.patch('/notes/:index',(req,res)=>{
    const index = req.params.index;
    const descprition = req.body.descprition;
    notes[index].descprition = descprition;
    res.status(200).json({message:"NOTE UPDATED SUCCESSFULLY"});
});

//exporting server to use in different file
module.exports = app;




//After eac hsession is started and ended the notes disappear as they are stored in RAM and to keep them permanently we need to use a database and we'll link it.
/*
IN POST REQUEST:
{
    "title": "test_title",
    "description": "test_description"
}
    

GET IS HANDELED BY POSTMAN AUTOMATICALLY NO BODY NEEDED

DELETE REQUEST:
localhost:3000/notes/0 -> index of note to be deleted has to be provided in url


PATCH REQUEST:
localhost:3000/notes/0 -> index of note to be updated has to be provided in url
{
    "description": "updated_description"
}
*/

