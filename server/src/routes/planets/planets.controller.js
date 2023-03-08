const { getAllPlanets } = require('../../models/planets.model');

async function httpGetAllPlanets (req, res) {
    return res.status(200).json(await getAllPlanets()); 
    // return makes sure only 1 response is sent
}

module.exports ={
    httpGetAllPlanets,
}