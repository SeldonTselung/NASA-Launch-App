const axios = require('axios');
const launchesDB = require('./launches.mongo');
const planets = require('./planets.mongo');

const defaultFlightNumber = 101;

//to map the properties to the correct values in the SpaceX API
const launch = {
    flightNumber: defaultFlightNumber, //flight_number
    mission: "Kepler Exploration X", //name
    rocket: 'Explorer IS1', //rocket.name
    launchDate: new Date('December 27, 2030'), //date_local
    target: 'Kepler-442 b', //not applicable
    customers: ['ZTM', 'NASA'],//each payload has multiple customers payload.customers
    upcoming: true, //upcoming
    success: true, //success
}

//save launch into mongoDB 
saveLaunch(launch);

const SPACEX_API_URL = "https://api.spacexdata.com/v4/launches/query"

//make a req to spaceX API
async function populateLaunches() { 
    console.log('Populating launch data...');
    const response = await axios.post(SPACEX_API_URL, { //req body same as body in postman
        query: {},
        options: {
            pagination: false, //to turn off pagination of data from spaceX server
            populate: [
                {
                    path: 'rocket',
                    select: {
                        name: 1
                    }
                },
                {
                    path: 'payloads',
                    select: {
                        customers: 1
                    }
                }
            ]
        }
    });

    if (response.status !== 200) {
        console.log('Problem downloading launch data');
        throw new Error('Launch data download failed');
    }

    const launchDocs = response.data.docs; //response.data is the response object
    for (const launchDoc of launchDocs) {
        const payloads = launchDoc['payloads'];
        //using flatMap because payloads is an arr of objects of many customers
        const customers = payloads.flatMap((payload) => {
            return payload['customers'];
        });
        //mapping launch to SpaceX API
        const launch = {
            flightNumber: launchDoc['flight_number'],
            mission: launchDoc['name'],
            rocket: launchDoc['rocket']['name'],
            launchDate: launchDoc['date_local'],
            upcoming: launchDoc['upcoming'],
            success: launchDoc['success'],
            customers,
        };
        console.log(`${launch.flightNumber} ${launch.mission}`);
        //save launch to MongoDB
        await saveLaunch(launch);
    }
}

async function loadLaunchesData() {
    //since this is an expensive operation, we will download launchdata only once
    //that we don't already have based on these filters
    const firstLaunch = await findLaunch({
        flightNumber: 1,
        rocket: 'Falcon 1',
        mission: 'FalconSat',
    });
    if (firstLaunch) {
        console.log('Launch data already loaded');
    } else {
        await populateLaunches();
    }
}


async function saveLaunch(launch) {
    //saving to mongoDB
    await launchesDB.findOneAndUpdate({ //this is better than updateOne becuz this will only return
        //the properties that we set in our update
        //if there's an existing flightNumber, then don't update that 
        flightNumber: launch.flightNumber, //takes the filter
    }, launch, // object to update
    {
        upsert: true, // 
    });
}

//save launch from client into mongoDB
async function saveNewLaunch(launch) {
    //maintaining referential integrity to make sure we're targetting a valid planet
    const planet = await planets.findOne({
        keplerName: launch.target,
    });
    if (!planet) {
        //we'll throw a new error using Node's built in error class
        throw new Error('No matching planet found');
    }

    const latestFlightNumber = await getLatestFlightNumber() + 1;

    const newLaunch = Object.assign(launch, {
        flightNumber: latestFlightNumber,
        customers: ['ZTM', 'NASA'],
        upcoming: true,
        success: true,
    });
    //console.log(newLaunch)
    await saveLaunch(newLaunch);
}

//get latest flight number
async function getLatestFlightNumber() {
    const latestLaunch = await launchesDB
    .findOne()
    .sort('-flightNumber');// - indicates descending order
    if (!latestLaunch) {
        return defaultFlightNumber;
    }
    return latestLaunch.flightNumber;
}

//get all the launches from mongoDB launches collection
//and filters out id and version properties from each doc
async function getAllLaunches(skip, limit) {
    return await launchesDB
    .find({}, {
        '_id': 0, 
        '__v': 0,
    })
    .sort({ flightNumber: 1 }) // 1 for ascending & -1 for descending in MongoDB.
    .skip(skip)
    .limit(limit);
}

async function findLaunch(filter) {
    return await launchesDB.findOne(filter);
}

// 
async function existsLaunchWithId (launchId) {
    return await findLaunch({ // if it returns an obj then launch exists
        flightNumber: launchId,
    })
}

async function abortLaunchById(launchId) {
    const aborted = await launchesDB.updateOne({
        flightNumber: launchId,
    }, {
        upcoming: false,
        success: false,
    });//no upsert parameter becuz we don't want to insert a document into launches
    //collection if one doesn't exist. 
    // response from mongoDB that shows that it was successfully aborted
    return aborted.modifiedCount === 1;  
} 

module.exports = {
    loadLaunchesData,
    getAllLaunches,
    saveNewLaunch,
    existsLaunchWithId,
    abortLaunchById,
}