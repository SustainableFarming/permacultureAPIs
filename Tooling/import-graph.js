
const Gremlin = require('gremlin');
//var config = require("./config");
//var async = require('async');
const readline = require("readline");
const fs = require("fs");

// escape
function escape(value) {
    return String(value).replace(/"/g, "'");
}

// contains
Array.prototype.contains = function(value) {
    return (this.indexOf(value) > -1);
}

// connect to gremlin
const client = Gremlin.createClient(
    443,
    "permaapigraph.gremlin.cosmosdb.azure.com",
    { 
        "session": false, 
        "ssl": true, 
        "user": `/dbs/db/colls/plants`,
        "password": "b9uWeZpiwdrFM68dQIkYBVTuGrYVsm4NQPNk78yWa6tSDGglKYDPQm0a1GPT0Vkz4iV8pAV3ZukzJK9mRqrziw=="
    }
);

// function to execute a query
function execute(query) {
    return new Promise((resolve, reject) => {
        client.execute(query, { }, (err, results) => {
            if (!err) {
                const o = JSON.stringify(results);
                resolve(o);
            } else {
                reject(err);
            }
        });
    });
}

// read each line from the file
const plants = [];
const lineReader = readline.createInterface({
    input: fs.createReadStream('./details.json')
});
lineReader.on('line', function (line) {
    const plant = JSON.parse(line);
    plants.push(plant);
});
lineReader.on("close", function() {
    console.log(`read ${plants.length} plants from the import file...`);

    // import the data
    (async () => {
        try {
    
            // drop existing
            console.log("dropping graph...");
            await execute("g.E().drop()");
            await execute("g.V().drop()");
            console.log("dropped graph.");                

            // write each plant
            let count = 0;
            for (let plant of plants) {
                const query = `g.addV("plant")
                    .property("id", "${plant.id}")
                    .property("commonName", "${escape(plant['Common name'])}")
                    .property("rootType", "${escape(plant['Root Type'])}")
                    .property("standPersistence", "${escape(plant['Stand Persistence'])}")
                    .property("rootDepth", "${escape(plant['_root_depth_cm'])}")
                    .property("usdaZoneFrom", "${escape(plant['_usda_hardiness_from'])}")
                    .property("usdaZoneTo", "${escape(plant['_usda_hardiness_to'])}")
                    .property("drought", "${escape(plant['Drought'])}")
                    .property("texture", "${escape(plant['Texture'])}")
                    .property("growthRate", "${escape(plant['Growth Rate'])}")
                    .property("soilType", "${escape(plant['Soil Type'])}")
                    .property("nativeToNAmer", "${escape(plant['Native to North America?'])}")
                    .property("scientificName", "${escape(plant['Scientific name'])}")
                    .property("spreadTo", "${escape(plant['_to_spread_cm'])}")
                    .property("spreadFrom", "${escape(plant['_from_spread_cm'])}")
                    .property("notes", "${escape(plant['Notes'])}")
                    .property("seasonalInterest", "${escape(plant['Seasonal Interest'])}")
                    .property("bacteriaFungalRatio", "${escape(plant['Bacteria-Fungal Ratio'])}")
                    .property("flowerColor", "${escape(plant['Flower Color'])}")
                    .property("lifeSpan", "${escape(plant['Life Span'])}")
                    .property("windStormDamage", "${escape(plant['Wind Storm Damage'])}")
                    .property("mowing", "${escape(plant['Mowing'])}")
                    .property("fungalTypes", "${escape(plant['Fungal Types'])}")
                    .property("soilMoisture", "${escape(plant['Soil Moisture'])}")
                    .property("bloomTime", "${escape(plant['Bloom Time'])}")
                    .property("fireDamage", "${escape(plant['Fire Damage'])}")
                    .property("animalDamage", "${escape(plant['Animal Damage'])}")
                    .property("coldInjury", "${escape(plant['Cold Injury'])}")
                    .property("soilCompaction", "${escape(plant['Soil Compaction'])}")
                    .property("pestDamage", "${escape(plant['Insect/Pest Damage'])}")
                    .property("plantCategory", "${escape(plant['Plant Category'])}")
                    .property("heightFrom", "${escape(plant['_from_height_cm'])}")
                    .property("heightTo", "${escape(plant['_to_height_cm'])}")
                    .property("flood", "${escape(plant['Flood'])}")
                    .property("growingSeason", "${escape(plant['Growing Season'])}")
                    .property("diseaseIssues", "${escape(plant['Disease Issues'])}")
                    .property("salt", "${escape(plant['Salt'])}")
                    .property("fruitTime", "${escape(plant['Fruit Time'])}")
                    .property("form", "${escape(plant['Form'])}")
                    .property("fruitType", "${escape(plant['Fruit Type'])}")
                    .property("sun", "${escape(plant['Sun'])}")
                    .property("plantType", "${escape(plant['Plant Type'])}")
                    .property("soilPhFrom", "${escape(plant['_soil_ph_from'])}")
                    .property("soilPhTo", "${escape(plant['_soil_ph_to'])}")`;
                count++;
                if (count % 100 === 0) console.log(`wrote ${count} plant(s)...`);
                await execute(query);
            }
            console.log(`wrote ${plants.length} plant(s).`);

            // add compatibleWith / incompatibleWith / uses
            const uses = [];
            for (let plant of plants) {
                plant.compatibleWith = [];
                plant.incompatibleWith = [];
                plant.plantedWith = [];
                plant.uses = [];
                if (plant._companions) {
                    for (let companion of plant._companions) {
                        const found = plants.find(p => p["Common name"] === companion.Companion);
                        if (found) {
                            const id = Number(found.id);
                            switch (companion.Compatible) {
                                case "Yes":
                                    if (!plant.compatibleWith.contains(id)) plant.compatibleWith.push(id);
                                    break;
                                case "No":
                                    if (!plant.incompatibleWith.contains(id)) plant.incompatibleWith.push(id);
                                    break;
                                default:
                                    console.error(`(Compatible?) Unaccounted for: ${companion.Compatible}.`);
                            }    
                        } else {
                            console.error(`Companion \"${companion.Companion}\" not found.`);
                        }
                    }
                }
                if (plant._uses) {
                    for (let use of plant._uses) {
                        if (!uses.contains(use.Use)) uses.push(use.Use);
                        plant.uses.push( 50000 + uses.indexOf(use.Use) );
                    }
                }
            }

            // add plantedWith
            const polys_s = fs.readFileSync("./allpolys2.json");
            const polys = JSON.parse(polys_s);
            for (let polyNode of polys) {
                for (let node in polyNode) {
                    const poly = polyNode[node];
                    for (let pix = 1; pix < poly.length; pix++) {
                        const pri = plants.find(p => p.id === poly[pix].ID);
                        for (let six = 1; six < poly.length; six++) {
                            const sec = plants.find(p => p.id === poly[six].ID);
                            if (pri && sec) {
                                const pid = Number(pri.ID);
                                const sid = Number(sec.id);
                                if (pid !== sid && !pri.plantedWith.contains(sid)) pri.plantedWith.push(sid);    
                            }
                        }
                    }
                }
            }

            // write uses
            for (let i = 0; i < uses.length; i++) {
                const query = `g.addV("use")
                .property("id", "${50000 + i}")
                .property("name", "${uses[i]}")`;
                console.log(`use: ${uses[i]}`);
                await execute(query);
            }
            console.log(`wrote ${uses.length} uses...`);

            // write relationships
            count = 0;
            for (let plant of plants) {
                for (let other_id of plant.compatibleWith) {
                    await execute(`g.V('${plant.id}').addE('compatibleWith').to(g.V('${other_id}'))`);
                }
                for (let other_id of plant.incompatibleWith) {
                    await execute(`g.V('${plant.id}').addE('incompatibleWith').to(g.V('${other_id}'))`);
                }
                for (let other_id of plant.plantedWith) {
                    await execute(`g.V('${plant.id}').addE('plantedWith').to(g.V('${other_id}'))`);
                }
                for (let use_id of plant.uses) {
                    await execute(`g.V('${plant.id}').addE('usedFor').to(g.V('${use_id}'))`);
                }
                const total = plant.compatibleWith.length + plant.incompatibleWith.length + plant.plantedWith + uses;
                if (total > 0) console.log(`${plant["Common name"]}: ${total} relationships`);
                count++;
                if (count % 100 === 0) console.log(`wrote ${count} plant relationships...`);
            }

            // write statistics
            console.log(`plants that are compatibleWith: ${plants.filter(p => p.compatibleWith.length > 0).length}`);
            console.log(`plants that are incompatibleWith: ${plants.filter(p => p.incompatibleWith.length > 0).length}`);
            console.log(`plants that are plantedWith: ${plants.filter(p => p.plantedWith.length > 0).length}`);

            // close
            process.exit();
    
        } catch (ex) {
            console.error(ex);
        }
    })();    

});
