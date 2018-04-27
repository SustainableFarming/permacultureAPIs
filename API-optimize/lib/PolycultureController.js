
// includes
const express = require("express");
const Optimizer = require("./Optimizer");
const PlantDao = require("./PlantDao");

// create router
const router = express.Router();

// define optimize function
async function optimize(name, zone) {

    // connect to the database
    const dao = new PlantDao();
    dao.connect();

    // get the plant list
    const plants = await dao.getByName(name);
    if (plants.length > 20) throw new Error("We only support sets of 20 plants or fewer at this time.");
    const always = [ plants[0] ];
    plants.splice(0, 1);

    // send through the optimizer
    const optimizer = new Optimizer(always, plants, {
        usdaZone: zone
    }, {
        compatibleWith: 1000,
        incompatibleWith: -10000,
        plantedWith: 400,
        usdaZoneGood: 200,          // this is a perfect score, could be partial
        usdaZoneBad: -10000,        // this is a perfect bad, could be partial
        rootDepth: -200,            // this is for a single collision
        rootDepthRange: 0.1         // this is the percentage above/below the root depth to consider a collision
    });
    const start = Date.now();
    const scored = optimizer.score();

    // formulate the response
    const results = [];
    for (let i = 0; i < Math.min(5, scored.length); i++) {
        const result = scored[i];
        const plantDesc = [];
        for (const plant of result.plants) {
            plantDesc.push(plant.commonName);
        }
        results.push({
            score: result.score,
            plants: plantDesc,
            scoring: result.applied
        });
    }

    // results
    console.log(`total: ${scored.length}, after: ${((Date.now() - start) / 1000)} secs`);
    return results;

}

// endpoint: polyculture optimization
router.get('/:name', (req, res) => {

    // parameters
    const name = req.params.name;
    const zone = Number(req.query.zone);

    // run the optimization
    if (name && name.length > 0 && zone && Number.isInteger(zone)) {
        optimize(name, zone)
        .then(top5 => {
            res.send(top5);
        })
        .catch(ex => {
            console.error(ex);
            res.status(500).send(ex);
        });
    } else {
        res.status(400).send("You must supply a name and zone, ex. /Garlic?zone=4");
    }

});

// export the router
module.exports = router;