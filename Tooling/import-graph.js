
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
                    .property("soilPhFrom", "${escape(plant._soil_ph_from)}")
                    .property("soilPhTo", "${escape(plant._soil_ph_to)}")`;
                count++;
                if (count % 100 === 0) console.log(`wrote ${count} plant(s)...`);
                await execute(query);
            }
            console.log(`wrote ${plants.length} plant(s).`);

            // add compatibleWith / incompatibleWith
            for (let plant of plants) {
                plant.compatibleWith = [];
                plant.incompatibleWith = [];
                plant.plantedWith = [];
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
                                const sid = Number(sec.ID);
                                if (pid !== sid && !pri.plantedWith.contains(sid)) pri.plantedWith.push(sid);    
                            }
                        }
                    }
                }
            }

            // write relationships
            count = 0;
            for (let plant of plants) {
                for (let other of plant.compatibleWith) {
                    await execute(`g.V('${plant.id}').addE('compatibleWith').to(g.V('${other.id}'))`);
                }
                for (let other of plant.incompatibleWith) {
                    await execute(`g.V('${plant.id}').addE('incompatibleWith').to(g.V('${other.id}'))`);
                }
                for (let other of plant.plantedWith) {
                    await execute(`g.V('${plant.id}').addE('plantedWith').to(g.V('${other.id}'))`);
                }
                //const total = plant.compatibleWith.length + plant.incompatibleWith.length + plant.plantedWith;
                //if (total > 0) console.log(`${plant["Common name"]}: ${total} relationships`);
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
