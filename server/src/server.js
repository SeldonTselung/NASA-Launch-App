const http = require ('http');
require('dotenv').config();
const app = require('./app');
const { mongoConnect } = require ('./services/mongo');
const { loadPlanetsData } = require('./models/planets.model');
const { loadLaunchesData } = require('./models/launches.model');

//process.env will pick a port if 8000 is not available 
const PORT = process.env.PORT || 8000;

const server = http.createServer(app);

async function startServer() {
    await mongoConnect(); //
    await loadPlanetsData(); //Kepler's data from planets model
    await loadLaunchesData(); //Launch data from launch model
    server.listen(PORT, () => {
        console.log(`Listening on port ${PORT}...`)
    });
}

startServer();

