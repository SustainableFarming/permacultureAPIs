
// includes
const Gremlin = require("gremlin");

// private variables
const _client = new WeakMap();

// Plant Data Access Object class
module.exports = class PlantDao {

    get client() {
        return _client.get(this);
    }

    query(cmd) {
        return new Promise((resolve, reject) => {
            this.client.execute(cmd, { }, (err, results) => {
                if (!err) {
                    const o = JSON.stringify(results);
                    resolve(o);
                } else {
                    reject(err);
                }
            });
        });
    }    

    async getByQuery(cmd) {
        try {
            const plants = [];
            const uses = [];

            // get all information
            const results_s = await this.query(cmd);
            const results_j = JSON.parse(results_s);
            for (const result of results_j) {
                switch (result.label) {
                    case "plant":
                        const plant = {
                            id: Number(result.id),
                            compatibleWith: [],
                            incompatibleWith: [],
                            plantedWith: [],
                            usedFor: []
                        };
                        for (const property in result.properties) {
                            plant[property] = result.properties[property][0].value;
                        }
                        plants.push(plant); // the primary plant must be returned first
                        break;
                    case "use":
                        uses.push({
                            id: Number(result.id),
                            name: result.properties["name"][0].value                            
                        });
                        break;
                }
            }
            for (const result of results_j) {
                switch (result.label) {
                    case "compatibleWith":
                        const out1 = plants.find(p => p.id === Number(result.outV));
                        const in1 = plants.find(p => p.id === Number(result.inV));
                        if (out1 && in1) {
                            out1.compatibleWith.push(in1.id);
                        }
                        break;
                    case "incompatibleWith":
                        const out2 = plants.find(p => p.id === Number(result.outV));
                        const in2 = plants.find(p => p.id === Number(result.inV));
                        if (out2 && in2) {
                            out2.incompatibleWith.push(in2.id);
                        }
                        break;
                    case "plantedWith":
                        const out3 = plants.find(p => p.id === Number(result.outV));
                        const in3 = plants.find(p => p.id === Number(result.inV));
                        if (out3 && in3) {
                            out3.plantedWith.push(in3.id);
                        }
                        break;
                    case "usedFor":
                        const out4 = plants.find(p => p.id === Number(result.outV));
                        const in4 = uses.find(u => u.id === Number(result.inV));
                        if (out4 && in4) {
                            out4.usedFor.push(in4.name);
                        }
                        break;
                }
            }

            return plants;
        } catch (ex) {
            console.error(ex);
        }
    }

    async getById(id) {
        return await this.getByQuery(`g.V("${id}").union(__.as("plant"), out().as("related"), out().bothE().as("relationships"))`);
    }

    async getByName(name) {
        return await this.getByQuery(`g.V().has("commonName", "${name}").union(__.as("plant"), out().as("related"), out().bothE().as("relationships"))`);
    }

    connect() {
        _client.set(this, Gremlin.createClient(
            443,
            "permaapigraph.gremlin.cosmosdb.azure.com",
            { 
                "session": false, 
                "ssl": true, 
                "user": `/dbs/db/colls/plants`,
                "password": "b9uWeZpiwdrFM68dQIkYBVTuGrYVsm4NQPNk78yWa6tSDGglKYDPQm0a1GPT0Vkz4iV8pAV3ZukzJK9mRqrziw=="
            }
        ));
    }

}