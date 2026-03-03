const express = require('express');
const app = express(); //creates server instance
app.listen(3000, () => { //listens on port 3000
    console.log('Server is running on port 3000');
});

app.get('/', (req, res) => { //handles GET request to root URL
    res.send('Hello, World!');
    console.log('Received a request at /');
});

app.get('/home', (req, res) => { //handles GET request to /home URL
    res.send('Hello, HOME!');
    console.log('Received a request at /home');
});