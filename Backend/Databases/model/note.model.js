const mongoose = require("mongoose");

const NoteSchema = mongoose.Schema({
    title: String,
    description: String,
});

const NoteModel = mongoose.model("note",NoteSchema);

module.exports = NoteModel;