const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const planets = require('./planets.mongo');

console.log(planets)
function isHabitable(planet) {
    return planet['koi_disposition'] === 'CONFIRMED'
    && planet['koi_insol'] > .36 && planet['koi_insol'] < 1.11
    && planet['koi_prad'] < 1.6;
}
/*
const promise = new Promise((res, rej) => {
    resolve(42);
});
promise.then((result) => {

}) 
const result = await promise;
console.log(result);
*/
function loadPlanetsData() {
    return new Promise ((resolve, reject) => {
        //will give an event emitter
        fs.createReadStream(path.join(__dirname, "..", "..", "data",'kepler_data.csv')) 
        .pipe(parse({
            comment: '#',
            columns: true, //return each row in our CSV file as a JavaScript
            // object with key-value pairs, rather than as just an array of values in our row.
        }))
        .on("data", async (data) => { //response to each data event
            if (isHabitable(data)) { 
            //we need upsert to add only if data is updated, else we 
            //would end up adding duplicates everytime we called this function
               savePlanet(data); //save to mongo
            }
        })
        .on('error', (err) => { //response to error event
            console.log(err);
            reject(err);
        })
        .on("end", async () => { //response to all events
            const countPlanetsFound = (await getAllPlanets()).length;
            console.log(`${countPlanetsFound} habitable planets found!`);
            resolve();
        });
    }) 
};

async function getAllPlanets() {
    return await planets.find({}, {
        '_id': 0, '__v': 0,
    });
};

async function savePlanet(planet) {
    try {
        //insert + update = upsert
        //upsert inserts data into a collection if it doesn't already exist in that collection.
        //if that document does exist, then it updates that document with whatever you pass into the upsert operation.
        await planets.updateOne({
                keplerName: planet.kepler_name,
            }, {
                keplerName: planet.kepler_name,
            }, {
                upsert: true,
            }); //saving to mongo
    } catch(err) {
        console.log(`Could not save planet ${err}`)
    } 
};

module.exports = {
    getAllPlanets,
    loadPlanetsData,
};