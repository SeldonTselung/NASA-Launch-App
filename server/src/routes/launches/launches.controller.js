const { 
    getAllLaunches, 
    saveNewLaunch,
    abortLaunchById,
    existsLaunchWithId,
} = require('../../models/launches.model');

//async because getAllLaunches is async
async function httpGetAllLaunches (req, res) {
    //first convert to js
    return res.status(200).json(await getAllLaunches()); 
    // return makes sure only 1 response is sent
}

async function httpPostNewLaunch (req, res) {
    //console.log(req.body)
    const launch = req.body;
    if (!launch.mission || !launch.rocket || !launch.launchDate 
        || !launch.target) {
          return res.status(400).json({
            error: 'Missing required launch property',
        });
    }
    launch.launchDate = new Date(launch.launchDate);
    if (isNaN(launch.launchDate)) {
        return res.status(400).json({
            error: 'Invalid launch date',
        });
    }
    //console.log(launch)
    await saveNewLaunch(launch); //save from client into Mongo
    //this must be mutating our launch object, changing the properties and 
    //adding data that mongoose gets back from our db onto the very same object that we passed in
    //console.log(launch)
    return res.status(201).json(launch); // return the data created with 201
}


async function httpAbortLaunch (req, res) {
    const launchId = Number(req.params.id); // cuz this gives a string
    const existsLaunch = await existsLaunchWithId(launchId);
     //if launch !exist return 404
    if (!existsLaunch) {
        return res.status(404).json({
            error: 'Launch not found',
        });
    }
    const aborted = await abortLaunchById(launchId);
    if (!aborted) {
        return res.status(400).json({
            error: 'Launch not aborted',
        });
    }
    return res.status(200).json({
        ok: true,
    });
}

module.exports ={
    httpGetAllLaunches,
    httpPostNewLaunch,
    httpAbortLaunch,
    existsLaunchWithId,
}