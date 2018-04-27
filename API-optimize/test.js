
const Optimizer = require("./lib/Optimizer");
const PlantDao = require("./lib/PlantDao");

/*
const always = [
    {
        "id": "1",
        "commonName": "apple",
        "compatibleWith": [ "2", "6", "88" ],
        "incompatibleWith": [ "3" ],
        "plantedWith": "5",
        "usdaZoneFrom": "6",
        "usdaZoneTo": "8",
        "rootDepth": "30"
    },
    {
        "id": "2",
        "commonName": "celery",
        "usdaZoneFrom": "7",
        "usdaZoneTo": "8",
        "rootDepth": "24"
    }
];

const maybe = [
    {
        "id": "3",
        "commonName": "pear",
        "compatibleWith": [ "1" ],
        "usdaZoneFrom": "8",
        "usdaZoneTo": "9",
        "rootDepth": "32"
    },
    {
        "id": "4",
        "commonName": "grape",
        "usdaZoneFrom": "10",
        "usdaZoneTo": "11",
        "rootDepth": "30"
    },
    {
        "id": "5",
        "commonName": "banana",
        "usdaZoneFrom": "4",
        "usdaZoneTo": "9",
        "rootDepth": 36
    }
];
*/

(async () => {
    const dao = new PlantDao();
    dao.connect();

    const plants = await dao.get("2901");
    const always = [ plants[0] ];
    plants.splice(0, 1);

    const optimizer = new Optimizer(always, plants, {
        usdaZone: 3
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
    const total = optimizer.score();
    const top5 = optimizer.score().slice(0, 4);
    for (let scored of top5) {
        console.log(`${scored.score}: ${JSON.stringify(scored.plants)}: ${JSON.stringify(scored.applied)}\n`);
    }
    console.log(`total: ${total.length}, after: ${((Date.now() - start) / 1000)} secs`);

})();
