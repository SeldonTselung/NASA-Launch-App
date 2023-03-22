const express = require ('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require("path");
const api = require('./routes/api');

const app = express();

app.use(cors({
    origin: 'http://localhost:8000',
}));
//morgan goes as high after security middleware so it goes here
app.use(morgan('tiny'));

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")))

//this allows us to support multiple versions of our api
app.use('/v1', api); 

//when none of the paths match the routes above, the code below will
//route other paths due to '*'
app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

module.exports = app;
