
const Optimizer = require("./lib/Optimizer");

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


const optimizer = new Optimizer(always, maybe, {
    usdaZone: 10
}, {
    compatibleWith: 1000,
    incompatibleWith: -10000,
    plantedWith: 400,
    usdaZoneGood: 200,          // this is a perfect score, could be partial
    usdaZoneBad: -10000,        // this is a perfect bad, could be partial
    rootDepth: -200,            // this is for a single collision
    rootDepthRange: 0.1         // this is the percentage above/below the root depth to consider a collision
});
for (let scored of optimizer.score()) {
    console.log(`${scored.score}: ${JSON.stringify(scored.plants)}: ${JSON.stringify(scored.applied)}\n`);
}
