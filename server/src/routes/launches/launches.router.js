const express = require('express');

const { httpGetAllLaunches, httpPostNewLaunch, httpAbortLaunch,
} = require('./launches.controller');

const launchesRouter = express.Router();

// /launches
launchesRouter.get("/", httpGetAllLaunches);
launchesRouter.post("/", httpPostNewLaunch);
launchesRouter.delete('/:id', httpAbortLaunch); 

module.exports = launchesRouter; 
