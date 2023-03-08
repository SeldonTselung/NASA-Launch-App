const axios = require('axios');
const launchesDB = require('./launches.mongo');
const planets = require('./planets.mongo');

const defaultFlightNumber = 101;

const launch = {
    flightNumber: defaultFlightNumber, //flight_number
    mission: "Kepler Exploration X", //name
    rocket: 'Explorer IS1', //exists in our api response's rocket.name
    launchDate: new Date('December 27, 2030'), //date_local
    target: 'Kepler-442 b', //not applicable
    customers: ['ZTM', 'NASA'],//payloads is an arr with multiple customers payload.customers
    upcoming: true, //upcoming
    success: true, //success
}

//save launch into mongoDB 
saveLaunch(launch);

const SPACEX_API_URL = "https://api.spacexdata.com/v4/launches/query"

async function populateLaunches() {
    console.log('Poup launch data...');
    const response = await axios.post(SPACEX_API_URL, { //req body
        query: {},
        options: {
            pagination: false, //to turn off pagination of data by server
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
                        'customers': 1
                    }
                }
            ]
        }
        
    });

    const launchDocs = response.data.docs; //response.data is what we get back from response
    for (const launchDoc of launchDocs) {
        const payloads = launchDoc['payloads'];
        const customers = payloads.flatMap((payload) => {
            return payload['customers'];
        });

        const launch = {
            flightNumber: launchDoc['flight_number'],
            mission: launchDoc['name'],
            rocket: launchDoc['rocket']['name'],
            launchDate: launchDoc['date_local'],
            upcoming: launchDoc['upcoming'],
            success: launchDoc['success'],
            customers: customers,
        };
        console.log(`${launch.flightNumber} ${launch.mission}`);

        //populate launches collection...
    }
}

async function loadLaunchData() {
    //since this is an expensive operation, we will download only launchdata 
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
    //maintaining referential integrity to make sure we're targetting a valid planet
    const planet = await planets.findOne({
        keplerName: launch.target,
    });
    if (!planet) {
        //we'll throw a new error using Node's built in error class
        throw new Error('No matching planet found');
    }
    //saving to mongoDB
    await launchesDB.findOneAndUpdate({ //this is better than updateOne becuz this will only return
        //the properties that we set in our update
        //if there's an existing flightNumber, then don't update that 
        flightNumber: launch.flightNumber, //takes the filter
    }, 
    launch, // object to update
     {
        upsert: true, // 
    })
}

//save launch from client into mongoDB
async function saveNewLaunch(launch) {
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
async function getAllLaunches() {
    return await launchesDB.find({}, {
        '_id': 0, '__v': 0,
    })
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
    loadLaunchData,
    getAllLaunches,
    saveNewLaunch,
    abortLaunchById,
    existsLaunchWithId,
}